/**
 * Intake Router — BSI-aligned category intake forms
 *
 * Endpoints:
 *   getForm                — returns schema fields metadata + existing answers + company context
 *   getRequirementAnswers  — one requirement's answers
 *   saveRequirementAnswers — upsert one requirement's answers (the requirement page)
 *
 * Signing off is not done here. A requirement is signed through
 * assessment.signOff, which enforces the required role and the roster.
 */

import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { hasReviewAccess } from "@/lib/auth";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import type { Database, DbOrTx } from "@/lib/db";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import {
  company,
  companyAssessment,
  companyCategoryIntake,
  companyRequirementStatus,
  requirement,
  requirementCategory,
} from "@/schema";
import { enforceAssignment, verifyAssessmentOwnership } from "../guards";
import { recalculateProgress } from "../helpers/assessment-helpers";
import { answerSaveChange, hasSignOffToWithdraw } from "../helpers/manual-status";
import {
  announceWithdrawal,
  reopenedReviewDate,
  withdrawSignOff,
} from "../helpers/withdraw-sign-off";
import { companyProcedure, router } from "../init";

export const intakeRouter = router({
  // --------------------------------------------------------------------------
  // getForm — load schema metadata + existing answers
  // --------------------------------------------------------------------------
  getForm: companyProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
        categoryCode: z.string(),
      }),
    )
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
  // getRequirementAnswers — scoped read of intake answers for one requirement
  // --------------------------------------------------------------------------
  getRequirementAnswers: companyProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
        requirementCode: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const fieldInfo = REQUIREMENT_FIELD_MAP[input.requirementCode];
      if (!fieldInfo)
        return { answers: {} as Record<string, unknown>, fieldKeys: [] as string[] };

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
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
        requirementCode: z.string(),
        answers: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const categoryCode = await authorizeIntakeWrite(ctx, input);

      // A requirement of another category would write its field keys into this
      // category's intake row, where this category's owner never asked for them.
      const fieldInfo = REQUIREMENT_FIELD_MAP[input.requirementCode];
      if (fieldInfo?.categoryCode !== categoryCode) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No intake fields mapped to ${input.requirementCode} in category ${categoryCode}`,
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
      const schema = CATEGORY_SCHEMAS[categoryCode];
      const fields = schema ? introspectSchema(schema, []) : [];
      const requiredFields = fields.filter((f) => f.required);
      const filledRequired = requiredFields.filter((f) => {
        const val = merged[f.key];
        return val !== undefined && val !== null && val !== "";
      });
      const completionPct =
        requiredFields.length > 0
          ? Math.round((filledRequired.length / requiredFields.length) * 100)
          : 0;

      // Only this requirement's answers changed (no intake field is shared
      // between requirements), so only this requirement moves. Deriving from
      // every answered field in the category used to reopen each signed
      // sibling as well, clearing signatures nobody had touched.
      await writeAnswers(ctx, {
        assessmentId: input.assessmentId,
        categoryId: input.categoryId,
        existingId: existing?.id ?? null,
        answers: merged,
        completionPct,
        requirementCodes: fieldInfo.fieldKeys.some((key) => isAnswered(merged[key]))
          ? [input.requirementCode]
          : [],
      });

      return { completionPct };
    }),
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Authorize a write to a category's intake and return the category's code.
 *
 * Every write needs the category owner or an admin, the same rule as sign-off.
 * A save with filled fields moves mapped requirements back to in_progress and
 * clears their signatures, so letting anyone in the company save let a
 * reviewer or a member of another category undo sign-offs they could not make.
 *
 * The code is read from the category row, never taken from the caller. When
 * both came from input, the id decided who was let in while the code decided
 * which schema was checked and which requirements were approved, so the owner
 * of one category could approve another's by sending their own id with its
 * code. The category must also belong to the assessment's framework.
 */
async function authorizeIntakeWrite(
  ctx: {
    db: Database;
    companyId: string;
    userId: string;
    session: { role: string };
  },
  input: { assessmentId: string; categoryId: string },
): Promise<string> {
  const { frameworkId } = await verifyAssessmentOwnership(
    ctx.db,
    input.assessmentId,
    ctx.companyId,
  );
  await enforceAssignment(ctx.db, {
    role: ctx.session.role,
    userId: ctx.userId,
    assessmentId: input.assessmentId,
    categoryId: input.categoryId,
  });

  const category = await ctx.db.query.requirementCategory.findFirst({
    where: and(
      eq(requirementCategory.id, input.categoryId),
      eq(requirementCategory.frameworkId, frameworkId),
    ),
    columns: { code: true },
  });
  if (!category) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
  }
  return category.code;
}

type IntakeWriter = Parameters<typeof authorizeIntakeWrite>[0];

function isAnswered(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

/**
 * Store a category's intake answers and move the requirements the save covers
 * to in progress, in one transaction, so a refused move stores no answers.
 */
async function writeAnswers(
  ctx: IntakeWriter,
  args: {
    assessmentId: string;
    categoryId: string;
    existingId: string | null;
    answers: Record<string, unknown>;
    completionPct: number;
    requirementCodes: readonly string[];
  },
) {
  const now = new Date();
  const saved = { answers: args.answers, completionPct: args.completionPct };

  const withdrawn = await ctx.db.transaction(async (tx) => {
    const reopened = await moveToInProgress(tx, {
      companyId: ctx.companyId,
      userId: ctx.userId,
      role: ctx.session.role,
      assessmentId: args.assessmentId,
      requirementCodes: args.requirementCodes,
      now,
    });

    if (args.existingId) {
      await tx
        .update(companyCategoryIntake)
        .set({ ...saved, lastSavedBy: ctx.userId, lastSavedAt: now })
        .where(eq(companyCategoryIntake.id, args.existingId));
    } else {
      await tx.insert(companyCategoryIntake).values({
        ...saved,
        assessmentId: args.assessmentId,
        categoryId: args.categoryId,
        lastSavedBy: ctx.userId,
        lastSavedAt: now,
      });
    }
    return reopened;
  });

  if (withdrawn.length === 0) return;
  await recalculateProgress(ctx.db, args.assessmentId);
  for (const reopened of withdrawn) {
    announceWithdrawal(ctx.db, {
      ...reopened,
      companyId: ctx.companyId,
      actorId: ctx.userId,
      now,
    });
  }
}

/**
 * Move the requirements a save covers to in progress, and return the sign-offs
 * that withdrew, to announce once the transaction has committed.
 *
 * Changed answers no longer stand behind a signature, so a signed requirement
 * is reopened exactly as `assessment.reopenRequirement` reopens it: every
 * signer's signature goes, not only the row's. Leaving the per-signer rows
 * signed let one new signature close a multi-signer requirement on stale
 * ones. An approved requirement moves only for someone with review access,
 * the rule reopening has, so pressing Save cannot undo a reviewer's approval.
 */
async function moveToInProgress(
  tx: DbOrTx,
  args: {
    companyId: string;
    userId: string;
    role: string;
    assessmentId: string;
    requirementCodes: readonly string[];
    now: Date;
  },
) {
  if (args.requirementCodes.length === 0) return [];

  const reqs = await tx.query.requirement.findMany({
    where: inArray(requirement.code, [...args.requirementCodes]),
    columns: { id: true, code: true, categoryId: true, frequency: true, priority: true },
  });
  if (reqs.length === 0) return [];
  const reqById = new Map(reqs.map((r) => [r.id, r]));

  // Status rows are locked first and in id order, before withdrawSignOff
  // touches any signer rows, which is the order signOff, confirmModuleRef and
  // reopenRequirement take them in (see lockStatusRow). The lock also keeps
  // an approval or a sign-off from landing between the checks below and the
  // writes after them.
  const rows = await tx
    .select({
      id: companyRequirementStatus.id,
      requirementId: companyRequirementStatus.requirementId,
      status: companyRequirementStatus.status,
      signedOffBy: companyRequirementStatus.signedOffBy,
      signedOffAt: companyRequirementStatus.signedOffAt,
    })
    .from(companyRequirementStatus)
    .where(
      and(
        eq(companyRequirementStatus.assessmentId, args.assessmentId),
        inArray(companyRequirementStatus.requirementId, [...reqById.keys()]),
      ),
    )
    .orderBy(asc(companyRequirementStatus.id))
    .for("update");

  const change = answerSaveChange(
    rows.map((row) => row.status),
    hasReviewAccess(args.role),
  );
  if (!change.ok) {
    throw new TRPCError({ code: change.code, message: change.message });
  }

  const movable = rows.filter((row) => row.status !== "not_applicable");
  const unsignedIds = movable
    .filter((row) => !hasSignOffToWithdraw(row))
    .map((row) => row.id);
  if (unsignedIds.length > 0) {
    await tx
      .update(companyRequirementStatus)
      .set({ status: "in_progress", updatedAt: args.now })
      .where(inArray(companyRequirementStatus.id, unsignedIds));
  }

  const signed = movable.filter(hasSignOffToWithdraw);
  if (signed.length === 0) return [];

  const assessment = await tx.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, args.assessmentId),
    columns: { startedAt: true },
  });

  const withdrawn = [];
  for (const previous of signed) {
    const req = reqById.get(previous.requirementId);
    if (!req) continue;
    const { row, losingSignature } = await withdrawSignOff(tx, {
      statusId: previous.id,
      companyId: args.companyId,
      actorId: args.userId,
      nextReviewDate: reopenedReviewDate({
        assessmentStartedAt: assessment?.startedAt ?? null,
        frequency: req.frequency,
        priority: req.priority,
      }),
      now: args.now,
    });
    withdrawn.push({
      requirement: req,
      previous,
      newStatus: row?.status ?? "in_progress",
      losingSignature,
    });
  }
  return withdrawn;
}
