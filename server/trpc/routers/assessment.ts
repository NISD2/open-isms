import { z } from "zod";
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, companyProcedure, adminProcedure } from "../init";
import {
  company,
  user,
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
  requirement,
  requirementCategory,
  evidence,
  auditLog,
  categoryAssignment,
  requirementAssignment,
  requirementPrerequisite,
  requirementSatisfaction,
} from "@/schema";
import { or } from "drizzle-orm";
import { frameworkEnum } from "@nisd2/grc-data-model/enums";
import { enforceAssignment, verifyAssessmentOwnership, getSignerRole } from "../guards";
import { sendMail, contactEmailChangedEmail } from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { scheduleDeadlineReminders, backfillInitialDeadlines } from "@/lib/compliance/schedule-notifications";
import { toDateString } from "@/lib/compliance/deadlines";
import { addYears } from "date-fns";

import { buildSignOffSnapshot, recalculateProgress, propagateSatisfaction } from "../helpers/assessment-helpers";
import { createAssessmentsForFrameworks, processTeamRoleAssignments } from "../helpers/setup-helpers";
import { recordSignOffChainEntry } from "../helpers/sign-off-chain";
import {
  completedSignOffValues,
  effectiveSignOffRole,
  signerMeetsRequiredRole,
  snapshotForVersion,
} from "../helpers/sign-off-completion";

import type { Database } from "@/lib/db";

const DONE_STATUSES = new Set(["completed", "approved", "not_applicable"]);

// Prerequisites are advisory only — the UI surfaces them as a "recommended
// first" suggestion (see RequirementDetail), but nothing blocks sign-off.
// getPrerequisiteStatuses below still reads the data to render that hint.

export const assessmentRouter = router({
  // ---------------------------------------------------------------------------
  // Company
  // ---------------------------------------------------------------------------

  getCompany: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return null;
    const row = await ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
    });
    return row ?? null;
  }),

  updateCompany: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        sector: z.string().min(1).max(255).optional(),
        entityType: z.enum(["essential", "important", "kritis"]).optional(),
        legalForm: z.string().max(100).nullish(),
        employeeCount: z.number().int().positive().nullish(),
        contactEmail: z.string().email().nullish(),
        aiDataSharing: z.enum(["none", "basic", "full"]).optional(),
        cisoName: z.string().max(255).nullish(),
        cisoReportsTo: z.string().max(255).nullish(),
        bsiContactName: z.string().max(255).nullish(),
        bsiContactEmail: z.string().email().nullish(),
        bsiContactPhone: z.string().max(50).nullish(),
        bsiRegistrationId: z.string().max(100).nullish(),
        annualSecurityBudget: z.string().nullish(),
        primaryLocations: z.string().max(1000).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // adminProcedure already enforces ctx.companyId is set + role === "admin"
      const prev = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
      });
      if (!prev) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const [updated] = await ctx.db
        .update(company)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(company.id, ctx.companyId))
        .returning();

      logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "company.updated",
        entityType: "company",
        entityId: ctx.companyId,
        description: "Company settings updated",
        previousValue: prev,
        newValue: input,
      });

      if (
        input.contactEmail &&
        prev.contactEmail &&
        input.contactEmail !== prev.contactEmail
      ) {
        const template = contactEmailChangedEmail({
          companyName: updated.name,
          oldEmail: prev.contactEmail,
          newEmail: input.contactEmail,
        });
        sendMail({ to: prev.contactEmail, ...template });
        sendMail({ to: input.contactEmail, ...template });
      }

      return updated;
    }),

  // deleteCompany and bumpTemplateVersion moved to devRouter (build-gated).
  // See server/trpc/routers/dev.ts. Audit B-1 / T-1 (2026-06-10).

  // ---------------------------------------------------------------------------
  // Assessment queries
  // ---------------------------------------------------------------------------

  getActiveAssessment: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return null;
    const assessment = await ctx.db.query.companyAssessment.findFirst({
      where: eq(companyAssessment.companyId, ctx.companyId),
    });
    return assessment ?? null;
  }),

  getAssessmentForFramework: protectedProcedure
    .input(z.object({ frameworkCode: z.enum(frameworkEnum.enumValues) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.companyId) return null;
      const framework = await ctx.db.query.complianceFramework.findFirst({
        where: eq(complianceFramework.code, input.frameworkCode),
      });
      if (!framework) return null;

      const assessment = await ctx.db.query.companyAssessment.findFirst({
        where: and(
          eq(companyAssessment.companyId, ctx.companyId),
          eq(companyAssessment.frameworkId, framework.id),
        ),
      });
      return assessment ?? null;
    }),

  listAssessments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.companyAssessment.findMany({
      where: eq(companyAssessment.companyId, ctx.companyId),
      with: {
        framework: {
          columns: { id: true, code: true, version: true },
        },
      },
      orderBy: asc(companyAssessment.startedAt),
    });
  }),

  // ---------------------------------------------------------------------------
  // Assessment setup
  // ---------------------------------------------------------------------------

  createCompanyAndAssessment: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        sector: z.string().min(1).max(255),
        entityType: z.enum(["essential", "important", "kritis"]),
        legalForm: z.string().max(100).optional(),
        employeeCount: z.number().int().positive().optional(),
        contactEmail: z.string().email().optional(),
        aiDataSharing: z.enum(["none", "basic", "full"]).optional(),
        cisoName: z.string().max(255).optional(),
        cisoReportsTo: z.string().max(255).optional(),
        bsiContactName: z.string().max(255).optional(),
        bsiContactEmail: z.string().email().optional(),
        bsiContactPhone: z.string().max(50).optional(),
        bsiRegistrationId: z.string().max(100).optional(),
        annualSecurityBudget: z.string().optional(),
        primaryLocations: z.string().max(1000).optional(),
        teamRoles: z
          .array(
            z.object({
              roleKey: z.string(),
              name: z.string().max(255).optional(),
              email: z.string().email(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Every verified user auto-gets a DRAFT company at email verification, so
      // "already has a company" no longer means "already onboarded". Only an
      // ACTIVATED company blocks a fresh onboarding; a draft is reused — filled
      // in with the real identity and flipped to activated. The guard therefore
      // checks activatedAt, not merely companyId presence. UI gating in
      // /onboarding is not a security control, so this is the real boundary.
      const current = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { companyId: true },
      });
      const existing = current?.companyId
        ? await ctx.db.query.company.findFirst({
            where: eq(company.id, current.companyId),
            columns: { id: true, activatedAt: true, ownerId: true },
          })
        : null;
      // Reject if the caller is already in a real (activated) company, OR is a
      // non-owner member of a draft shell — a member must not activate and seize
      // ownership of a draft they do not own. A user's own auto-provisioned draft
      // always has ownerId === userId, so the normal path is unaffected.
      if (existing && (existing.activatedAt || existing.ownerId !== ctx.userId)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of a company",
        });
      }

      // The confirmed identity + the activation stamps. Shared by the reuse and
      // the create paths so activation is identical either way.
      const activatedValues = {
        name: input.name,
        sector: input.sector,
        entityType: input.entityType,
        // The creator owns the org. Deleting the owner tears the org down.
        ownerId: ctx.userId,
        // This endpoint IS the entity-portal onboarding flow — declare the
        // entity role and stamp activation now.
        actsAsNis2Entity: true,
        activatedAt: new Date(),
        legalForm: input.legalForm ?? null,
        employeeCount: input.employeeCount ?? null,
        contactEmail: input.contactEmail ?? null,
        aiDataSharing: input.aiDataSharing ?? "none",
        cisoName: input.cisoName ?? null,
        cisoReportsTo: input.cisoReportsTo ?? null,
        bsiContactName: input.bsiContactName ?? null,
        bsiContactEmail: input.bsiContactEmail ?? null,
        bsiContactPhone: input.bsiContactPhone ?? null,
        bsiRegistrationId: input.bsiRegistrationId ?? null,
        annualSecurityBudget: input.annualSecurityBudget ?? null,
        primaryLocations: input.primaryLocations ?? null,
      };

      const result = await ctx.db.transaction(async (tx) => {
        let companyId: string;
        let frameworkAssessmentMap: Map<string, string>;
        let firstAssessmentId: string;

        if (existing) {
          // Activate the draft: fill identity + flip + stamp. The assessment /
          // status rows were seeded at draft time, so restamp their entityType
          // snapshot instead of re-seeding.
          companyId = existing.id;
          await tx
            .update(company)
            .set({ ...activatedValues, updatedAt: new Date() })
            .where(eq(company.id, companyId));

          const seeded = await tx.query.companyAssessment.findMany({
            where: eq(companyAssessment.companyId, companyId),
            columns: { id: true, frameworkId: true },
          });
          if (seeded.length === 0) {
            // A draft should always carry seeded assessments; seed defensively.
            const created = await createAssessmentsForFrameworks(
              tx,
              companyId,
              input.entityType,
            );
            frameworkAssessmentMap = created.frameworkAssessmentMap;
            firstAssessmentId = created.firstAssessmentId;
          } else {
            await tx
              .update(companyAssessment)
              .set({ entityTypeAtAssessment: input.entityType, updatedAt: new Date() })
              .where(eq(companyAssessment.companyId, companyId));
            frameworkAssessmentMap = new Map(seeded.map((a) => [a.frameworkId, a.id]));
            firstAssessmentId = seeded[0].id;
          }
        } else {
          // No draft (edge / legacy path) — create, own, seed, activate in one.
          const [newCompany] = await tx
            .insert(company)
            .values(activatedValues)
            .returning();
          companyId = newCompany.id;
          await tx
            .update(user)
            .set({ companyId, role: "admin", updatedAt: new Date() })
            .where(eq(user.id, ctx.userId));
          const created = await createAssessmentsForFrameworks(
            tx,
            companyId,
            input.entityType,
          );
          frameworkAssessmentMap = created.frameworkAssessmentMap;
          firstAssessmentId = created.firstAssessmentId;
        }

        if (input.teamRoles && input.teamRoles.length > 0) {
          await processTeamRoleAssignments(tx, {
            teamRoles: input.teamRoles,
            companyId,
            companyName: input.name,
            userId: ctx.userId,
            userEmail: ctx.session.user.email ?? undefined,
            userName: ctx.session.user.name ?? undefined,
            frameworkAssessmentMap,
          });
        }

        return { firstAssessmentId, companyId, frameworkAssessmentMap };
      });

      for (const [, assessmentId] of result.frameworkAssessmentMap) {
        backfillInitialDeadlines(ctx.db, {
          assessmentId,
          companyId: result.companyId,
          userId: ctx.userId,
        }).catch((err) => console.error("[background] deadlines:", err));
      }

      return { assessmentId: result.firstAssessmentId, companyId: result.companyId };
    }),

  // ---------------------------------------------------------------------------
  // Requirement statuses
  // ---------------------------------------------------------------------------

  getStatusesByCategory: companyProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const rows = await ctx.db
        .select({
          requirementId: requirement.id,
          requirementCode: requirement.code,
          status: companyRequirementStatus,
        })
        .from(requirement)
        .leftJoin(
          companyRequirementStatus,
          and(
            eq(companyRequirementStatus.requirementId, requirement.id),
            eq(companyRequirementStatus.assessmentId, input.assessmentId),
          ),
        )
        .where(eq(requirement.categoryId, input.categoryId))
        .orderBy(asc(requirement.sortOrder));

      return rows;
    }),

  updateRequirementStatus: companyProcedure
    .input(
      z.object({
        statusId: z.string().uuid(),
        status: z.enum(["not_started", "in_progress", "completed", "not_applicable", "needs_review"]),
        isApplicable: z.boolean().optional(),
        notApplicableReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { statusId, ...updates } = input;

      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, statusId),
        with: { requirement: { columns: { id: true, categoryId: true } } },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }

      await verifyAssessmentOwnership(ctx.db, statusRow.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: statusRow.assessmentId,
        categoryId: statusRow.requirement.categoryId,
      });

      const values: Record<string, unknown> = { ...updates, updatedAt: new Date() };
      if (input.status === "not_applicable") {
        values.isApplicable = false;
        values.nextReviewDate = toDateString(addYears(new Date(), 1));
        values.lastReviewedAt = new Date();
      }
      if (input.status === "completed") {
        values.completedAt = new Date();
        values.completedBy = ctx.userId;
        if (statusRow.status === "rejected") {
          values.reviewedBy = null;
          values.reviewedAt = null;
          values.reviewFeedback = null;
        }
      }

      const [updated] = await ctx.db
        .update(companyRequirementStatus)
        .set(values)
        .where(eq(companyRequirementStatus.id, statusId))
        .returning();

      if (updated) {
        await recalculateProgress(ctx.db, updated.assessmentId);
        if (input.status === "completed" && ctx.companyId) {
          scheduleDeadlineReminders(ctx.db, {
            statusId: updated.id,
            anchorDate: new Date(),
            companyId: ctx.companyId,
            userId: ctx.userId,
          }).catch((err) => console.error("[background] deadlines:", err));
        }
      }

      return updated;
    }),

  getProgressByCategory: companyProcedure
    .input(z.object({ assessmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);
      const rows = await ctx.db
        .select({
          categoryId: requirement.categoryId,
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${companyRequirementStatus.status} in ('completed', 'approved', 'not_applicable'))::int`,
        })
        .from(companyRequirementStatus)
        .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id))
        .where(eq(companyRequirementStatus.assessmentId, input.assessmentId))
        .groupBy(requirement.categoryId);

      const result: Record<string, { completed: number; total: number }> = {};
      for (const row of rows) {
        result[row.categoryId] = { completed: row.completed, total: row.total };
      }
      return result;
    }),

  // ---------------------------------------------------------------------------
  // Prerequisite statuses (for UI — shows which prerequisites are met/unmet)
  // ---------------------------------------------------------------------------

  getPrerequisiteStatuses: companyProcedure
    .input(z.object({ assessmentId: z.string().uuid(), requirementId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // companyProcedure only guarantees a companyId exists; it does not scope
      // the assessmentId the caller sends. Without this the leftJoin below reads
      // another tenant's completion state for any assessment id the caller knows.
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const rows = await ctx.db
        .select({
          code: requirement.code,
          categorySlug: requirementCategory.slug,
          status: companyRequirementStatus.status,
        })
        .from(requirementPrerequisite)
        .innerJoin(requirement, eq(requirementPrerequisite.prerequisiteId, requirement.id))
        .innerJoin(requirementCategory, eq(requirement.categoryId, requirementCategory.id))
        .leftJoin(
          companyRequirementStatus,
          and(
            eq(companyRequirementStatus.requirementId, requirement.id),
            eq(companyRequirementStatus.assessmentId, input.assessmentId),
          ),
        )
        .where(eq(requirementPrerequisite.requirementId, input.requirementId));

      return rows.map((r) => ({
        code: r.code,
        categorySlug: r.categorySlug,
        isComplete: DONE_STATUSES.has(r.status ?? "not_started"),
      }));
    }),

  // ---------------------------------------------------------------------------
  // Sign-off
  // ---------------------------------------------------------------------------

  signOff: companyProcedure
    .input(z.object({ statusId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.statusId),
        with: {
          requirement: { columns: { id: true, categoryId: true, templateVersion: true, requiredSignOffRole: true } },
        },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }

      await verifyAssessmentOwnership(ctx.db, statusRow.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: statusRow.assessmentId,
        categoryId: statusRow.requirement.categoryId,
      });

      const signedOffRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);

      // Audit B-2 + B-5 (2026-06-10): everything that touches the
      // (assignments, status row, chain) trio happens in one transaction
      // with FOR UPDATE on the assignment rows. Without the lock, two
      // concurrent last-signers both see unsignedCount==0 and both
      // overwrite the status row (B-5). Without the chain entry inside
      // the same tx, a partial commit can leave the status row signed
      // off without a corresponding history row, defeating
      // verifySignOffChain (B-2).
      const result = await ctx.db.transaction(async (tx) => {
        const lockedAssignments = await tx
          .select()
          .from(requirementAssignment)
          .where(eq(requirementAssignment.statusId, input.statusId))
          .for("update");

        if (lockedAssignments.length > 0) {
          const myAssignment = lockedAssignments.find((a) => a.userId === ctx.userId);
          if (!myAssignment) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are not assigned to this requirement.",
            });
          }

          await tx
            .update(requirementAssignment)
            .set({ signedOffAt: new Date(), signedOffRole })
            .where(eq(requirementAssignment.id, myAssignment.id));

          const [{ count: unsignedCount }] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(requirementAssignment)
            .where(
              and(
                eq(requirementAssignment.statusId, input.statusId),
                sql`${requirementAssignment.signedOffAt} IS NULL`,
              ),
            );

          if (unsignedCount > 0) {
            const [partial] = await tx
              .update(companyRequirementStatus)
              .set({ status: "in_progress", updatedAt: new Date() })
              .where(eq(companyRequirementStatus.id, input.statusId))
              .returning();

            return { row: partial, snapshot: null };
          }
        } else {
          // Single-requirement path: refuse loudly. See signerMeetsRequiredRole.
          if (
            !signerMeetsRequiredRole({
              sessionRole: ctx.session.role,
              signerRole: signedOffRole,
              requiredSignOffRole: statusRow.requirement.requiredSignOffRole,
            })
          ) {
            const required = effectiveSignOffRole(statusRow.requirement.requiredSignOffRole);
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `This requirement requires sign-off by ${required.toUpperCase()}.`,
            });
          }

          await tx
            .insert(requirementAssignment)
            .values({
              statusId: input.statusId,
              userId: ctx.userId,
              assignedBy: ctx.userId,
              signedOffAt: new Date(),
              signedOffRole,
            })
            .onConflictDoUpdate({
              target: [requirementAssignment.statusId, requirementAssignment.userId],
              set: { signedOffAt: new Date(), signedOffRole },
            });
        }

        const snapshot = await buildSignOffSnapshot(
          tx as unknown as Database,
          ctx.companyId,
          statusRow.requirement.templateVersion,
        );

        const [closed] = await tx
          .update(companyRequirementStatus)
          .set(
            completedSignOffValues({
              userId: ctx.userId,
              signedOffRole,
              templateVersion: statusRow.requirement.templateVersion,
              snapshot,
              now: new Date(),
            }),
          )
          .where(eq(companyRequirementStatus.id, input.statusId))
          .returning();

        await recordSignOffChainEntry(tx as unknown as Database, {
          companyId: ctx.companyId,
          statusId: input.statusId,
          requirementId: statusRow.requirement.id,
          signedOffBy: ctx.userId,
          signedOffRole,
          source: "editor",
          templateVersion: statusRow.requirement.templateVersion,
          companyProfile: snapshot.companyProfile ?? {},
        });

        return { row: closed, snapshot };
      });

      if (result.row && result.snapshot) {
        await recalculateProgress(ctx.db, result.row.assessmentId);

        // Cross-framework propagation: signing X also credits any linked Y.
        // Outside the tx because it's a separate write surface that can be
        // safely retried — but a transient failure here leaves the status
        // row signed without the linked credits. Acceptable: the propagation
        // is a convenience, not the system of record.
        await propagateSatisfaction(ctx.db, {
          sourceRequirementId: statusRow.requirement.id,
          companyId: ctx.companyId,
          userId: ctx.userId,
          signedOffRole,
          snapshot: result.snapshot,
        }).catch((err) => console.error("[propagate] sign-off:", err));

        scheduleDeadlineReminders(ctx.db, {
          statusId: result.row.id,
          anchorDate: new Date(),
          companyId: ctx.companyId,
          userId: ctx.userId,
        }).catch((err) => console.error("[background] deadlines:", err));
      }

      return result.row;
    }),

  confirmModuleRef: companyProcedure
    .input(z.object({ statusId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.statusId),
        with: {
          requirement: { columns: { id: true, code: true, moduleRef: true, categoryId: true, templateVersion: true, requiredSignOffRole: true } },
        },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }
      if (!statusRow.requirement.moduleRef) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Requirement has no module reference" });
      }

      await verifyAssessmentOwnership(ctx.db, statusRow.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: statusRow.assessmentId,
        categoryId: statusRow.requirement.categoryId,
      });

      const signedOffRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);

      // Audit B-2 (2026-06-10): assignment + status + chain entry inside
      // the same tx so a partial commit cannot leave the chain disagreeing
      // with the status row.
      const result = await ctx.db.transaction(async (tx) => {
        // Same guard pair as signOff: an N-of-M requirement belongs to the
        // assignment flow (each signer signs individually), and an unassigned
        // requirement completes only with the required signer role (admin
        // bypass). FOR UPDATE matches signOff's locking; like there, it locks
        // existing rows only, so a concurrent first assignment can still race
        // the empty read.
        const lockedAssignments = await tx
          .select()
          .from(requirementAssignment)
          .where(eq(requirementAssignment.statusId, input.statusId))
          .for("update");
        if (lockedAssignments.length > 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This requirement has assigned signers; sign off through the assignment flow.",
          });
        }
        // Single-requirement path: refuse loudly. See signerMeetsRequiredRole.
        if (
          !signerMeetsRequiredRole({
            sessionRole: ctx.session.role,
            signerRole: signedOffRole,
            requiredSignOffRole: statusRow.requirement.requiredSignOffRole,
          })
        ) {
          const required = effectiveSignOffRole(statusRow.requirement.requiredSignOffRole);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `This requirement requires sign-off by ${required.toUpperCase()}.`,
          });
        }

        await tx
          .insert(requirementAssignment)
          .values({
            statusId: input.statusId,
            userId: ctx.userId,
            assignedBy: ctx.userId,
            signedOffAt: new Date(),
            signedOffRole,
          })
          .onConflictDoUpdate({
            target: [requirementAssignment.statusId, requirementAssignment.userId],
            set: { signedOffAt: new Date(), signedOffRole },
          });

        const snapshot = await buildSignOffSnapshot(
          tx as unknown as Database,
          ctx.companyId,
          statusRow.requirement.templateVersion,
        );

        const [updated] = await tx
          .update(companyRequirementStatus)
          .set(
            completedSignOffValues({
              userId: ctx.userId,
              signedOffRole,
              templateVersion: statusRow.requirement.templateVersion,
              snapshot,
              now: new Date(),
            }),
          )
          .where(eq(companyRequirementStatus.id, input.statusId))
          .returning();

        await recordSignOffChainEntry(tx as unknown as Database, {
          companyId: ctx.companyId,
          statusId: input.statusId,
          requirementId: statusRow.requirement.id,
          signedOffBy: ctx.userId,
          signedOffRole,
          source: "module_confirm",
          templateVersion: statusRow.requirement.templateVersion,
          companyProfile: snapshot.companyProfile ?? {},
          data: { moduleRef: statusRow.requirement.moduleRef },
        });

        return { row: updated, snapshot };
      });

      if (result.row) {
        await recalculateProgress(ctx.db, result.row.assessmentId);
        await logAudit({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: "requirement.module_confirmed",
          entityType: "requirement_status",
          entityId: input.statusId,
          description: `Confirmed ${statusRow.requirement.moduleRef} module satisfies ${statusRow.requirement.code}`,
        }).catch((err) => console.error("[audit] confirmModuleRef:", err));

        await propagateSatisfaction(ctx.db, {
          sourceRequirementId: statusRow.requirement.id,
          companyId: ctx.companyId,
          userId: ctx.userId,
          signedOffRole,
          snapshot: result.snapshot,
        }).catch((err) => console.error("[propagate] confirmModuleRef:", err));
      }

      return result.row;
    }),

  bulkConfirmModuleRef: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      statusIds: z.array(z.string().uuid()).min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const rows = await ctx.db
        .select({
          statusId: companyRequirementStatus.id,
          requirementId: requirement.id,
          requirementCode: requirement.code,
          moduleRef: requirement.moduleRef,
          categoryId: requirement.categoryId,
          currentStatus: companyRequirementStatus.status,
          templateVersion: requirement.templateVersion,
          requiredSignOffRole: requirement.requiredSignOffRole,
        })
        .from(companyRequirementStatus)
        .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id))
        .where(
          and(
            inArray(companyRequirementStatus.id, input.statusIds),
            eq(companyRequirementStatus.assessmentId, input.assessmentId),
          ),
        );

      // Confirming a module writes a completed sign-off, so it is subject to
      // the same per-requirement guards as signOff: it cannot complete a
      // requirement whose required signer role the caller does not hold
      // (admin bypass matches signOff), nor an N-of-M requirement whose
      // assigned signers must sign individually. See bulkSignOffCategory.
      const confirmerRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);
      const moduleRows = rows.filter(
        (r) => r.moduleRef && r.currentStatus !== "completed" && r.currentStatus !== "approved",
      );
      if (moduleRows.length === 0) return { confirmed: 0 };
      const confirmAssignedIds = new Set(
        (
          await ctx.db
            .select({ statusId: requirementAssignment.statusId })
            .from(requirementAssignment)
            .where(inArray(requirementAssignment.statusId, moduleRows.map((r) => r.statusId)))
        ).map((a) => a.statusId),
      );
      const toConfirm = moduleRows.filter((r) => {
        if (confirmAssignedIds.has(r.statusId)) return false;
        // Bulk path: skip, don't throw. See signerMeetsRequiredRole.
        return signerMeetsRequiredRole({
          sessionRole: ctx.session.role,
          signerRole: confirmerRole,
          requiredSignOffRole: r.requiredSignOffRole,
        });
      });
      if (toConfirm.length === 0) return { confirmed: 0 };

      const categoryIds = [...new Set(toConfirm.map((r) => r.categoryId))];
      for (const categoryId of categoryIds) {
        await enforceAssignment(ctx.db, {
          role: ctx.session.role,
          userId: ctx.userId,
          assessmentId: input.assessmentId,
          categoryId,
        });
      }

      const now = new Date();
      const signedOffRole = confirmerRole;
      // Company-scoped half of the snapshot, built once; each row re-stamps
      // its own templateVersion below.
      const baseSnapshot = await buildSignOffSnapshot(ctx.db, ctx.companyId, toConfirm[0].templateVersion);

      // Audit B-2 (2026-06-10): status writes + per-row chain entries inside
      // one tx. Each row is written individually and only chained if its own
      // update returned, so a row another writer already moved to
      // completed/approved is skipped rather than re-signed.
      const updated = await ctx.db.transaction(async (tx) => {
        const confirmed: string[] = [];
        for (const row of toConfirm) {
          const rowSnapshot = snapshotForVersion(baseSnapshot, row.templateVersion);
          const [updatedRow] = await tx
            .update(companyRequirementStatus)
            .set(
              completedSignOffValues({
                userId: ctx.userId,
                signedOffRole,
                templateVersion: row.templateVersion,
                snapshot: rowSnapshot,
                now,
              }),
            )
            .where(
              and(
                eq(companyRequirementStatus.id, row.statusId),
                sql`${companyRequirementStatus.status} NOT IN ('completed', 'approved')`,
              ),
            )
            .returning({ id: companyRequirementStatus.id });

          if (!updatedRow) continue;

          await recordSignOffChainEntry(tx as unknown as Database, {
            companyId: ctx.companyId,
            statusId: row.statusId,
            requirementId: row.requirementId,
            signedOffBy: ctx.userId,
            signedOffRole,
            source: "module_confirm",
            templateVersion: row.templateVersion,
            companyProfile: rowSnapshot.companyProfile ?? {},
            data: { moduleRef: row.moduleRef, code: row.requirementCode },
          });

          confirmed.push(updatedRow.id);
        }

        return confirmed;
      });

      await recalculateProgress(ctx.db, input.assessmentId);

      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "requirement.bulk_module_confirmed",
        entityType: "assessment",
        entityId: input.assessmentId,
        description: `Bulk-confirmed ${updated.length} module-backed requirements`,
      }).catch((err) => console.error("[audit] bulkConfirmModuleRef:", err));

      return { confirmed: updated.length };
    }),

  bulkSignOffCategory: companyProcedure
    .input(z.object({
      assessmentId: z.string().uuid(),
      categoryId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: input.assessmentId,
        categoryId: input.categoryId,
      });

      const rows = await ctx.db
        .select({
          statusId: companyRequirementStatus.id,
          requirementId: requirement.id,
          code: requirement.code,
          categoryId: requirement.categoryId,
          currentStatus: companyRequirementStatus.status,
          templateVersion: requirement.templateVersion,
          requiredSignOffRole: requirement.requiredSignOffRole,
        })
        .from(companyRequirementStatus)
        .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id))
        .where(
          and(
            eq(companyRequirementStatus.assessmentId, input.assessmentId),
            eq(requirement.categoryId, input.categoryId),
            sql`${companyRequirementStatus.status} NOT IN ('completed', 'approved', 'not_applicable')`,
          ),
        );

      if (rows.length === 0) return { signedOff: 0 };

      const signedOffRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);

      // Bulk sign-off must not be a back door around the per-requirement
      // guards the single signOff path enforces. Two things it cannot
      // shortcut: (1) a required signer role (e.g. CEO for the §38 duties) —
      // same admin-bypass rule as signOff; (2) N-of-M requirements, whose
      // assigned signers must each sign through the assignment flow. Rows
      // failing either check are left untouched, not silently completed.
      const assignedStatusIds = new Set(
        (
          await ctx.db
            .select({ statusId: requirementAssignment.statusId })
            .from(requirementAssignment)
            .where(
              inArray(
                requirementAssignment.statusId,
                rows.map((r) => r.statusId),
              ),
            )
        ).map((a) => a.statusId),
      );
      const signableRows = rows.filter((row) => {
        if (assignedStatusIds.has(row.statusId)) return false;
        // Bulk path: skip, don't throw. See signerMeetsRequiredRole.
        return signerMeetsRequiredRole({
          sessionRole: ctx.session.role,
          signerRole: signedOffRole,
          requiredSignOffRole: row.requiredSignOffRole,
        });
      });

      if (signableRows.length === 0) return { signedOff: 0 };

      const now = new Date();
      // Company-scoped half of the snapshot, built once; each row re-stamps
      // its own templateVersion below.
      const baseSnapshot = await buildSignOffSnapshot(ctx.db, ctx.companyId, signableRows[0].templateVersion);

      // Audit B-2 (2026-06-10): per-row chain entry inside one tx. The status
      // guard is repeated on the write, not just in the read above, so a row
      // another writer completed between the two is skipped rather than
      // re-signed under this caller's name.
      const signedOff = await ctx.db.transaction(async (tx) => {
        const completed: string[] = [];
        for (const row of signableRows) {
          const rowSnapshot = snapshotForVersion(baseSnapshot, row.templateVersion);
          const [updatedRow] = await tx
            .update(companyRequirementStatus)
            .set(
              completedSignOffValues({
                userId: ctx.userId,
                signedOffRole,
                templateVersion: row.templateVersion,
                snapshot: rowSnapshot,
                now,
              }),
            )
            .where(
              and(
                eq(companyRequirementStatus.id, row.statusId),
                sql`${companyRequirementStatus.status} NOT IN ('completed', 'approved')`,
              ),
            )
            .returning({ id: companyRequirementStatus.id });

          if (!updatedRow) continue;

          await recordSignOffChainEntry(tx as unknown as Database, {
            companyId: ctx.companyId,
            statusId: row.statusId,
            requirementId: row.requirementId,
            signedOffBy: ctx.userId,
            signedOffRole,
            source: "editor",
            templateVersion: row.templateVersion,
            companyProfile: rowSnapshot.companyProfile ?? {},
            data: { code: row.code, bulkOf: "category", categoryId: input.categoryId },
          });

          completed.push(updatedRow.id);
        }
        return completed.length;
      });

      await recalculateProgress(ctx.db, input.assessmentId);

      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "requirement.bulk_category_signoff",
        entityType: "category",
        entityId: input.categoryId,
        description: `Bulk signed off ${signedOff} requirements in category`,
      }).catch((err) => console.error("[audit] bulkSignOffCategory:", err));

      return { signedOff };
    }),
});
