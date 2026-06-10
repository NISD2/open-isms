/**
 * Intake Router — BSI-aligned category intake forms
 *
 * Endpoints:
 *   getForm   — returns schema fields metadata + existing answers + company context
 *   save      — upsert draft answers (auto-save, debounced from client)
 *   submit    — validate, snapshot, derive requirement statuses, sign off
 */
import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import { verifyAssessmentOwnership, enforceAssignment, getSignerRole } from "../guards";
import {
  companyCategoryIntake,
  companyAssessment,
  companyRequirementStatus,
  requirement,
  requirementCategory,
  company,
} from "@/schema";
import {
  CATEGORY_SCHEMAS,
  CATEGORY_FIELD_MAPPING,
} from "@/lib/compliance/category-schemas";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { recordSignOffChainEntry } from "../helpers/sign-off-chain";
import type { Database } from "@/lib/db";

export const intakeRouter = router({
  // --------------------------------------------------------------------------
  // getForm — load schema metadata + existing answers
  // --------------------------------------------------------------------------
  getForm: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      categoryId: z.string().uuid(),
      categoryCode: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const schema = CATEGORY_SCHEMAS[input.categoryCode];
      if (!schema) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No intake schema for category ${input.categoryCode}`,
        });
      }

      const fields = introspectSchema(schema, []);

      const existing = await ctx.db.query.companyCategoryIntake.findFirst({
        where: and(
          eq(companyCategoryIntake.assessmentId, input.assessmentId),
          eq(companyCategoryIntake.categoryId, input.categoryId),
        ),
      });

      const companyProfile = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: {
          cisoName: true,
          cisoReportsTo: true,
          bsiContactName: true,
          bsiContactEmail: true,
          bsiRegistrationId: true,
          annualSecurityBudget: true,
          primaryLocations: true,
        },
      });

      return {
        fields,
        answers: (existing?.answers ?? {}) as Record<string, unknown>,
        completionPct: existing?.completionPct ?? 0,
        signedOffAt: existing?.signedOffAt?.toISOString() ?? null,
        companyProfile: companyProfile ?? {},
      };
    }),

  // --------------------------------------------------------------------------
  // save — upsert draft answers (auto-save)
  // --------------------------------------------------------------------------
  save: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      categoryId: z.string().uuid(),
      categoryCode: z.string(),
      answers: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const schema = CATEGORY_SCHEMAS[input.categoryCode];
      if (!schema) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No intake schema for category ${input.categoryCode}`,
        });
      }

      // Calculate completion percentage from filled fields
      const fields = introspectSchema(schema, []);
      const requiredFields = fields.filter((f) => f.required);
      const filledRequired = requiredFields.filter((f) => {
        const val = input.answers[f.key];
        if (val === undefined || val === null || val === "") return false;
        if (typeof val === "boolean") return true;
        return true;
      });
      const completionPct = requiredFields.length > 0
        ? Math.round((filledRequired.length / requiredFields.length) * 100)
        : 0;

      // Upsert
      const existing = await ctx.db.query.companyCategoryIntake.findFirst({
        where: and(
          eq(companyCategoryIntake.assessmentId, input.assessmentId),
          eq(companyCategoryIntake.categoryId, input.categoryId),
        ),
        columns: { id: true },
      });

      if (existing) {
        await ctx.db
          .update(companyCategoryIntake)
          .set({
            answers: input.answers,
            completionPct,
            lastSavedBy: ctx.userId,
            lastSavedAt: new Date(),
          })
          .where(eq(companyCategoryIntake.id, existing.id));
      } else {
        await ctx.db.insert(companyCategoryIntake).values({
          assessmentId: input.assessmentId,
          categoryId: input.categoryId,
          answers: input.answers,
          completionPct,
          lastSavedBy: ctx.userId,
          lastSavedAt: new Date(),
        });
      }

      // Auto-derive: mark mapped requirements as in_progress
      await deriveRequirementStatuses(
        ctx.db,
        input.assessmentId,
        input.categoryCode,
        input.answers,
        "in_progress",
      );

      return { completionPct };
    }),

  // --------------------------------------------------------------------------
  // submit — validate, snapshot, sign off all mapped requirements
  // --------------------------------------------------------------------------
  submit: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      categoryId: z.string().uuid(),
      categoryCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: input.assessmentId,
        categoryId: input.categoryId,
      });

      const schema = CATEGORY_SCHEMAS[input.categoryCode];
      if (!schema) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No intake schema for category ${input.categoryCode}`,
        });
      }

      // Load current answers
      const intake = await ctx.db.query.companyCategoryIntake.findFirst({
        where: and(
          eq(companyCategoryIntake.assessmentId, input.assessmentId),
          eq(companyCategoryIntake.categoryId, input.categoryId),
        ),
      });

      if (!intake) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No intake data found. Save the form first.",
        });
      }

      // Validate answers against schema
      const parseResult = schema.safeParse(intake.answers);
      if (!parseResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Incomplete form — please fill all required fields.",
        });
      }

      // Build sign-off snapshot
      const companyProfile = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: {
          cisoName: true,
          cisoReportsTo: true,
          bsiContactName: true,
          bsiContactEmail: true,
          annualSecurityBudget: true,
        },
      });
      const profileRecord: Record<string, unknown> = companyProfile ?? {};

      const signOffSnapshot: Record<string, unknown> = {
        answers: intake.answers,
        companyProfile: profileRecord,
        submittedAt: new Date().toISOString(),
      };

      // Update intake row with sign-off
      await ctx.db
        .update(companyCategoryIntake)
        .set({
          completionPct: 100,
          signedOffBy: ctx.userId,
          signedOffAt: new Date(),
          signOffSnapshot,
          lastSavedBy: ctx.userId,
          lastSavedAt: new Date(),
        })
        .where(eq(companyCategoryIntake.id, intake.id));

      const signedOffRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);

      // Mark ALL mapped requirements as approved (sign-off = approval).
      // Audit B-2 (2026-06-10): passes a chainContext so each
      // requirement that transitions to approved gets a
      // sign_off_history entry with source: "intake".
      await deriveRequirementStatuses(
        ctx.db,
        input.assessmentId,
        input.categoryCode,
        intake.answers as Record<string, unknown>,
        "approved",
        {
          companyId: ctx.companyId,
          userId: ctx.userId,
          signedOffRole,
          companyProfile: profileRecord,
        },
      );

      // Recalculate assessment progress
      await recalculateProgress(ctx.db, input.assessmentId);

      return { success: true };
    }),

  // --------------------------------------------------------------------------
  // getRequirementAnswers — scoped read of intake answers for one requirement
  // --------------------------------------------------------------------------
  getRequirementAnswers: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      categoryId: z.string().uuid(),
      requirementCode: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const fieldInfo = REQUIREMENT_FIELD_MAP[input.requirementCode];
      if (!fieldInfo) return { answers: {} as Record<string, unknown>, fieldKeys: [] as string[] };

      const intake = await ctx.db.query.companyCategoryIntake.findFirst({
        where: and(
          eq(companyCategoryIntake.assessmentId, input.assessmentId),
          eq(companyCategoryIntake.categoryId, input.categoryId),
        ),
        columns: { answers: true },
      });

      const allAnswers = (intake?.answers ?? {}) as Record<string, unknown>;
      const scoped: Record<string, unknown> = {};
      for (const key of fieldInfo.fieldKeys) {
        if (allAnswers[key] !== undefined) {
          scoped[key] = allAnswers[key];
        }
      }

      return { answers: scoped, fieldKeys: fieldInfo.fieldKeys };
    }),

  // --------------------------------------------------------------------------
  // saveRequirementAnswers — scoped write: merge answers for one requirement
  // --------------------------------------------------------------------------
  saveRequirementAnswers: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      categoryId: z.string().uuid(),
      categoryCode: z.string(),
      requirementCode: z.string(),
      answers: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const fieldInfo = REQUIREMENT_FIELD_MAP[input.requirementCode];
      if (!fieldInfo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No intake fields mapped to ${input.requirementCode}`,
        });
      }

      // Load existing category-level answers
      const existing = await ctx.db.query.companyCategoryIntake.findFirst({
        where: and(
          eq(companyCategoryIntake.assessmentId, input.assessmentId),
          eq(companyCategoryIntake.categoryId, input.categoryId),
        ),
      });

      // Shallow merge: only overwrite keys that belong to this requirement
      const currentAnswers = (existing?.answers ?? {}) as Record<string, unknown>;
      const merged = { ...currentAnswers };
      for (const key of fieldInfo.fieldKeys) {
        if (input.answers[key] !== undefined) {
          merged[key] = input.answers[key];
        }
      }

      // Recalculate completion for the full category
      const schema = CATEGORY_SCHEMAS[input.categoryCode];
      const fields = schema ? introspectSchema(schema, []) : [];
      const requiredFields = fields.filter((f) => f.required);
      const filledRequired = requiredFields.filter((f) => {
        const val = merged[f.key];
        return val !== undefined && val !== null && val !== "";
      });
      const completionPct = requiredFields.length > 0
        ? Math.round((filledRequired.length / requiredFields.length) * 100)
        : 0;

      if (existing) {
        await ctx.db
          .update(companyCategoryIntake)
          .set({
            answers: merged,
            completionPct,
            lastSavedBy: ctx.userId,
            lastSavedAt: new Date(),
          })
          .where(eq(companyCategoryIntake.id, existing.id));
      } else {
        await ctx.db.insert(companyCategoryIntake).values({
          assessmentId: input.assessmentId,
          categoryId: input.categoryId,
          answers: merged,
          completionPct,
          lastSavedBy: ctx.userId,
          lastSavedAt: new Date(),
        });
      }

      // Auto-derive requirement status to in_progress for the affected codes
      await deriveRequirementStatuses(
        ctx.db,
        input.assessmentId,
        input.categoryCode,
        merged,
        "in_progress",
      );

      return { completionPct };
    }),
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Derive requirement statuses from intake field answers.
 * For each answered field, find mapped requirement codes and update their status.
 *
 * Audit B-2 (2026-06-10): when `chainContext` is supplied and the target
 * status is terminal (completed / approved), an entry is appended to
 * `sign_off_history` per affected status row inside the same transaction.
 * Without the chain, intake-driven sign-offs were the largest writer of
 * `signOffSnapshot` rows with zero history entries, leaving
 * verifySignOffChain a no-op for every requirement that landed via intake.
 * Auto-derive calls from save / saveRequirementAnswers (targetStatus
 * `in_progress`) intentionally don't pass a chainContext — those are
 * draft transitions, not sign-offs.
 */
async function deriveRequirementStatuses(
  db: Database,
  assessmentId: string,
  categoryCode: string,
  answers: Record<string, unknown>,
  targetStatus: "in_progress" | "completed" | "approved",
  chainContext?: {
    companyId: string;
    userId: string;
    signedOffRole: string;
    companyProfile: Record<string, unknown>;
  },
) {
  const mapping = CATEGORY_FIELD_MAPPING[categoryCode];
  if (!mapping) return;

  const coveredCodes = new Set<string>();
  for (const [fieldKey, reqCodes] of Object.entries(mapping)) {
    const val = answers[fieldKey];
    const isFilled = val !== undefined && val !== null && val !== "";
    if (isFilled) {
      for (const code of reqCodes) {
        coveredCodes.add(code);
      }
    }
  }

  if (coveredCodes.size === 0) return;

  const reqs = await db.query.requirement.findMany({
    where: inArray(requirement.code, Array.from(coveredCodes)),
    columns: { id: true, code: true, templateVersion: true },
  });

  const reqIds = reqs.map((r) => r.id);
  if (reqIds.length === 0) return;
  const reqById = new Map(reqs.map((r) => [r.id, r]));

  const statuses = await db.query.companyRequirementStatus.findMany({
    where: and(
      eq(companyRequirementStatus.assessmentId, assessmentId),
      inArray(companyRequirementStatus.requirementId, reqIds),
    ),
  });

  const setsTerminal = targetStatus === "completed" || targetStatus === "approved";
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const status of statuses) {
      if (status.status === "not_applicable") continue;

      const isReopen =
        targetStatus === "in_progress" &&
        (status.status === "completed" || status.status === "approved");

      // Build the update payload. When this call originates from
      // intake.submit (chainContext supplied + terminal), also stamp
      // signedOffBy and signedOffRole — previously these stayed null
      // even though signedOffAt was set, so the sign-off row was
      // unattributable and the chain entry would record a signer the
      // status row didn't.
      const terminalPatch =
        setsTerminal && chainContext
          ? {
              completedAt: now,
              completedBy: chainContext.userId,
              signedOffAt: now,
              signedOffBy: chainContext.userId,
              signedOffRole: chainContext.signedOffRole,
            }
          : setsTerminal
            ? { completedAt: now, completedBy: null, signedOffAt: now }
            : {};

      const reopenPatch = isReopen
        ? {
            signedOffBy: null,
            signedOffAt: null,
            signedOffRole: null,
            completedAt: null,
            completedBy: null,
          }
        : {};

      await tx
        .update(companyRequirementStatus)
        .set({
          status: targetStatus,
          ...terminalPatch,
          ...reopenPatch,
          updatedAt: now,
        })
        .where(eq(companyRequirementStatus.id, status.id));

      if (setsTerminal && chainContext) {
        const req = reqById.get(status.requirementId);
        if (!req) continue;
        await recordSignOffChainEntry(tx as unknown as Database, {
          companyId: chainContext.companyId,
          statusId: status.id,
          requirementId: status.requirementId,
          signedOffBy: chainContext.userId,
          signedOffRole: chainContext.signedOffRole,
          source: "intake",
          templateVersion: req.templateVersion,
          companyProfile: chainContext.companyProfile,
          data: { categoryCode, requirementCode: req.code },
        });
      }
    }
  });
}

async function recalculateProgress(
  db: import("@/lib/db").Database,
  assessmentId: string,
) {
  const allStatuses = await db.query.companyRequirementStatus.findMany({
    where: eq(companyRequirementStatus.assessmentId, assessmentId),
  });
  const completed = allStatuses.filter(
    (s) => s.status === "completed" || s.status === "approved" || s.status === "not_applicable",
  ).length;
  const total = allStatuses.length;
  const percentage = total > 0 ? ((completed / total) * 100).toFixed(2) : "0";

  await db
    .update(companyAssessment)
    .set({
      completedRequirements: completed,
      compliancePercentage: percentage,
      updatedAt: new Date(),
    })
    .where(eq(companyAssessment.id, assessmentId));
}
