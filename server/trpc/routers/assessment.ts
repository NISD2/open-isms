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
import { DEFAULT_SIGN_OFF_ROLE, type RoleKey } from "@/lib/compliance/role-keys";
import { enforceAssignment, verifyAssessmentOwnership, getSignerRole } from "../guards";
import { sendMail, contactEmailChangedEmail } from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { scheduleDeadlineReminders, backfillInitialDeadlines } from "@/lib/compliance/schedule-notifications";
import { toDateString } from "@/lib/compliance/deadlines";
import { addYears } from "date-fns";

import { buildSignOffSnapshot, recalculateProgress, propagateSatisfaction } from "../helpers/assessment-helpers";
import { createAssessmentsForFrameworks, processTeamRoleAssignments } from "../helpers/setup-helpers";

import type { Database } from "@/lib/db";

const DONE_STATUSES = new Set(["completed", "approved", "not_applicable"]);

async function checkPrerequisites(db: Database, assessmentId: string, requirementId: string) {
  const prereqs = await db.query.requirementPrerequisite.findMany({
    where: eq(requirementPrerequisite.requirementId, requirementId),
    with: { prerequisite: { columns: { id: true, code: true } } },
  });
  if (!prereqs.length) return;

  const statuses = await db.query.companyRequirementStatus.findMany({
    where: and(
      eq(companyRequirementStatus.assessmentId, assessmentId),
      inArray(companyRequirementStatus.requirementId, prereqs.map((p) => p.prerequisite.id)),
    ),
    columns: { requirementId: true, status: true },
  });
  const statusMap = new Map(statuses.map((s) => [s.requirementId, s.status]));

  for (const p of prereqs) {
    if (!DONE_STATUSES.has(statusMap.get(p.prerequisite.id) ?? "not_started")) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Complete ${p.prerequisite.code} first`,
      });
    }
  }
}

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

  deleteCompany: adminProcedure.mutation(async ({ ctx }) => {
    const companyId = ctx.companyId;

    const assessments = await ctx.db.query.companyAssessment.findMany({
      where: eq(companyAssessment.companyId, companyId),
    });
    const assessmentIds = assessments.map((a) => a.id);

    if (assessmentIds.length > 0) {
      const statuses = await ctx.db.query.companyRequirementStatus.findMany({
        where: inArray(companyRequirementStatus.assessmentId, assessmentIds),
      });
      const statusIds = statuses.map((s) => s.id);

      if (statusIds.length > 0) {
        await ctx.db
          .delete(requirementAssignment)
          .where(inArray(requirementAssignment.statusId, statusIds));
        await ctx.db
          .delete(evidence)
          .where(inArray(evidence.requirementStatusId, statusIds));
      }

      await ctx.db
        .delete(companyRequirementStatus)
        .where(inArray(companyRequirementStatus.assessmentId, assessmentIds));

      await ctx.db
        .delete(categoryAssignment)
        .where(inArray(categoryAssignment.assessmentId, assessmentIds));

      await ctx.db
        .delete(companyAssessment)
        .where(eq(companyAssessment.companyId, companyId));
    }

    await ctx.db
      .delete(auditLog)
      .where(eq(auditLog.companyId, companyId));

    await ctx.db
      .update(user)
      .set({ companyId: null, updatedAt: new Date() })
      .where(eq(user.companyId, companyId));

    await ctx.db.delete(company).where(eq(company.id, companyId));

    return { deleted: true };
  }),

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
      // Reject if the user already belongs to a company. Without this guard,
      // a member of Company A could call this and silently become admin of a
      // brand-new Company B, orphaning their previous assignments and skipping
      // any verification flow. UI gating in /onboarding is not a security control.
      const current = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { companyId: true },
      });
      if (current?.companyId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of a company",
        });
      }

      const result = await ctx.db.transaction(async (tx) => {
        const [newCompany] = await tx
          .insert(company)
          .values({
            name: input.name,
            sector: input.sector,
            entityType: input.entityType,
            // This endpoint IS the entity-portal onboarding flow — set the
            // role flag explicitly. The schema default is now `false` so a
            // supplier-only signup never gets auto-flagged as a NIS2 entity.
            actsAsNis2Entity: true,
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
          })
          .returning();

        await tx
          .update(user)
          .set({ companyId: newCompany.id, role: "admin", updatedAt: new Date() })
          .where(eq(user.id, ctx.userId));

        const { firstAssessmentId, frameworkAssessmentMap } =
          await createAssessmentsForFrameworks(tx, newCompany.id, input.entityType);

        if (input.teamRoles && input.teamRoles.length > 0) {
          await processTeamRoleAssignments(tx, {
            teamRoles: input.teamRoles,
            companyId: newCompany.id,
            companyName: input.name,
            userId: ctx.userId,
            userEmail: ctx.session.user.email ?? undefined,
            userName: ctx.session.user.name ?? undefined,
            frameworkAssessmentMap,
          });
        }

        return { firstAssessmentId, companyId: newCompany.id, frameworkAssessmentMap };
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
  // Bulk prerequisite check — returns all blocked requirement codes for sidebar
  // ---------------------------------------------------------------------------

  getBlockedRequirements: companyProcedure
    .input(z.object({ assessmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Single query: join prerequisites with statuses, return only unmet pairs
      const rows = await ctx.db.execute<{
        blocked_code: string;
        prereq_code: string;
      }>(sql`
        SELECT r_blocked.code AS blocked_code, r_prereq.code AS prereq_code
        FROM requirement_prerequisite rp
        JOIN requirement r_blocked ON rp.requirement_id = r_blocked.id
        JOIN requirement r_prereq ON rp.prerequisite_id = r_prereq.id
        LEFT JOIN company_requirement_status crs_prereq
          ON crs_prereq.requirement_id = r_prereq.id
          AND crs_prereq.assessment_id = ${input.assessmentId}
        LEFT JOIN company_requirement_status crs_self
          ON crs_self.requirement_id = r_blocked.id
          AND crs_self.assessment_id = ${input.assessmentId}
        WHERE COALESCE(crs_prereq.status, 'not_started') NOT IN ('completed', 'approved', 'not_applicable')
          AND COALESCE(crs_self.status, 'not_started') NOT IN ('completed', 'approved', 'not_applicable')
      `);

      const blocked: Record<string, string[]> = {};
      for (const row of rows.rows) {
        if (!blocked[row.blocked_code]) blocked[row.blocked_code] = [];
        blocked[row.blocked_code].push(row.prereq_code);
      }
      return blocked;
    }),

  // ---------------------------------------------------------------------------
  // Prerequisite statuses (for UI — shows which prerequisites are met/unmet)
  // ---------------------------------------------------------------------------

  getPrerequisiteStatuses: companyProcedure
    .input(z.object({ assessmentId: z.string().uuid(), requirementId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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
          assignments: true,
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
      await checkPrerequisites(ctx.db, statusRow.assessmentId, statusRow.requirement.id);

      const signedOffRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);
      const effectiveRole: RoleKey =
        (statusRow.requirement.requiredSignOffRole as RoleKey | null) ?? DEFAULT_SIGN_OFF_ROLE;

      const assignments = statusRow.assignments ?? [];

      // If this requirement has assignment rows, enforce per-user sign-off
      if (assignments.length > 0) {
        const myAssignment = assignments.find((a) => a.userId === ctx.userId);
        if (!myAssignment) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to this requirement.",
          });
        }

        // Record this user's individual sign-off
        await ctx.db
          .update(requirementAssignment)
          .set({ signedOffAt: new Date(), signedOffRole })
          .where(eq(requirementAssignment.id, myAssignment.id));

        // Re-query for actual unsigned count (avoids stale snapshot race)
        const [{ count: unsignedCount }] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(requirementAssignment)
          .where(
            and(
              eq(requirementAssignment.statusId, input.statusId),
              sql`${requirementAssignment.signedOffAt} IS NULL`,
            ),
          );

        if (unsignedCount > 0) {
          // Not all signed yet — mark in_progress
          const [updated] = await ctx.db
            .update(companyRequirementStatus)
            .set({ status: "in_progress", updatedAt: new Date() })
            .where(eq(companyRequirementStatus.id, input.statusId))
            .returning();

          return updated;
        }
        // All signed — fall through to complete
      } else {
        // No assignments — enforce requiredSignOffRole (default: CISO)
        if (ctx.session.role !== "admin" && signedOffRole !== effectiveRole) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `This requirement requires sign-off by ${effectiveRole.toUpperCase()}.`,
          });
        }

        // Auto-assign the signer (creates assignment record with sign-off in one row)
        await ctx.db
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
        ctx.db, ctx.companyId, statusRow.requirement.templateVersion,
      );

      const [updated] = await ctx.db
        .update(companyRequirementStatus)
        .set({
          status: "completed",
          signedOffBy: ctx.userId,
          signedOffAt: new Date(),
          signedOffRole,
          signedOffTemplateVersion: statusRow.requirement.templateVersion,
          signOffSnapshot: snapshot,
          completedAt: new Date(),
          completedBy: ctx.userId,
          updatedAt: new Date(),
        })
        .where(eq(companyRequirementStatus.id, input.statusId))
        .returning();

      if (updated) {
        await recalculateProgress(ctx.db, updated.assessmentId);

        // Cross-framework propagation: signing X also signs any linked Y
        // (e.g., NIS2 SUP-5.1 ↔ GDPR DPA-1). Permissive — no role/assignment
        // re-check on the linked side. See requirement_satisfaction table.
        await propagateSatisfaction(ctx.db, {
          sourceRequirementId: statusRow.requirement.id,
          companyId: ctx.companyId,
          userId: ctx.userId,
          signedOffRole,
          snapshot,
        }).catch((err) => console.error("[propagate] sign-off:", err));

        if (ctx.companyId) {
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

  confirmModuleRef: companyProcedure
    .input(z.object({ statusId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.statusId),
        with: {
          requirement: { columns: { id: true, code: true, moduleRef: true, categoryId: true, templateVersion: true } },
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
      await checkPrerequisites(ctx.db, statusRow.assessmentId, statusRow.requirement.id);

      const signedOffRole = await getSignerRole(ctx.db, ctx.userId, ctx.session.role);

      // Auto-assign the signer
      await ctx.db
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
        ctx.db, ctx.companyId, statusRow.requirement.templateVersion,
      );

      const [updated] = await ctx.db
        .update(companyRequirementStatus)
        .set({
          status: "completed",
          completedAt: new Date(),
          completedBy: ctx.userId,
          signedOffBy: ctx.userId,
          signedOffAt: new Date(),
          signedOffRole,
          signedOffTemplateVersion: statusRow.requirement.templateVersion,
          signOffSnapshot: snapshot,
          updatedAt: new Date(),
        })
        .where(eq(companyRequirementStatus.id, input.statusId))
        .returning();

      if (updated) {
        await recalculateProgress(ctx.db, updated.assessmentId);
        logAudit({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: "requirement.module_confirmed",
          entityType: "requirement_status",
          entityId: input.statusId,
          description: `Confirmed ${statusRow.requirement.moduleRef} module satisfies ${statusRow.requirement.code}`,
        });

        await propagateSatisfaction(ctx.db, {
          sourceRequirementId: statusRow.requirement.id,
          companyId: ctx.companyId,
          userId: ctx.userId,
          signedOffRole,
          snapshot,
        }).catch((err) => console.error("[propagate] confirmModuleRef:", err));
      }

      return updated;
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
        })
        .from(companyRequirementStatus)
        .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id))
        .where(
          and(
            inArray(companyRequirementStatus.id, input.statusIds),
            eq(companyRequirementStatus.assessmentId, input.assessmentId),
          ),
        );

      const toConfirm = rows.filter(
        (r) => r.moduleRef && r.currentStatus !== "completed" && r.currentStatus !== "approved",
      );
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
      const statusIds = toConfirm.map((r) => r.statusId);
      const snapshot = await buildSignOffSnapshot(ctx.db, ctx.companyId, toConfirm[0].templateVersion);

      const updated = await ctx.db
        .update(companyRequirementStatus)
        .set({
          status: "completed",
          completedAt: now,
          completedBy: ctx.userId,
          signedOffBy: ctx.userId,
          signedOffAt: now,
          signOffSnapshot: snapshot,
          updatedAt: now,
        })
        .where(
          and(
            inArray(companyRequirementStatus.id, statusIds),
            sql`${companyRequirementStatus.status} NOT IN ('completed', 'approved')`,
          ),
        )
        .returning({ id: companyRequirementStatus.id });

      await recalculateProgress(ctx.db, input.assessmentId);

      logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "requirement.bulk_module_confirmed",
        entityType: "assessment",
        entityId: input.assessmentId,
        description: `Bulk-confirmed ${updated.length} module-backed requirements`,
      });

      return { confirmed: updated.length };
    }),

  bumpTemplateVersion: adminProcedure
    .input(z.object({ requirementIds: z.array(z.string().uuid()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: This procedure mutates GLOBAL `requirement` rows shared across
      // every tenant and flips `companyRequirementStatus` rows for ALL companies.
      // It is a tenant admin endpoint by ergonomics but a PLATFORM admin endpoint
      // by effect. Until a proper platform-admin role exists, gate it to dev only.
      // (Operators can still bump versions via a CLI / migration script in prod.)
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Template version bumps must be performed via CLI in production.",
        });
      }
      const reqs = await ctx.db
        .select({
          id: requirement.id,
          code: requirement.code,
          templateVersion: requirement.templateVersion,
          categoryId: requirement.categoryId,
        })
        .from(requirement)
        .innerJoin(requirementCategory, eq(requirement.categoryId, requirementCategory.id))
        .where(inArray(requirement.id, input.requirementIds));

      if (reqs.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No matching requirements" });
      }

      const now = new Date();
      let bumpedCount = 0;
      let flippedCount = 0;

      for (const req of reqs) {
        const newVersion = req.templateVersion + 1;
        await ctx.db
          .update(requirement)
          .set({ templateVersion: newVersion, updatedAt: now })
          .where(eq(requirement.id, req.id));

        const affected = await ctx.db
          .update(companyRequirementStatus)
          .set({ status: "needs_review", updatedAt: now })
          .where(
            and(
              eq(companyRequirementStatus.requirementId, req.id),
              sql`${companyRequirementStatus.status} IN ('completed', 'approved')`,
              sql`COALESCE((${companyRequirementStatus.signOffSnapshot}->>'templateVersion')::int, 0) < ${newVersion}`,
            ),
          )
          .returning({ id: companyRequirementStatus.id });

        bumpedCount++;
        flippedCount += affected.length;
      }

      logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "requirement.template_version_bumped",
        entityType: "requirement",
        entityId: reqs[0].id,
        description: `Bumped template version on ${bumpedCount} requirements, ${flippedCount} statuses flipped to needs_review`,
      });

      return { bumped: bumpedCount, flipped: flippedCount };
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

      const now = new Date();
      const snapshot = await buildSignOffSnapshot(ctx.db, ctx.companyId, rows[0].templateVersion);

      let signedOff = 0;
      for (const row of rows) {
        await ctx.db
          .update(companyRequirementStatus)
          .set({
            status: "completed",
            completedAt: now,
            completedBy: ctx.userId,
            signedOffBy: ctx.userId,
            signedOffAt: now,
            signedOffRole,
            signedOffTemplateVersion: row.templateVersion,
            signOffSnapshot: { ...snapshot, templateVersion: row.templateVersion },
            updatedAt: now,
          })
          .where(eq(companyRequirementStatus.id, row.statusId));
        signedOff++;
      }

      await recalculateProgress(ctx.db, input.assessmentId);

      logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "requirement.bulk_category_signoff",
        entityType: "category",
        entityId: input.categoryId,
        description: `Bulk signed off ${signedOff} requirements in category`,
      });

      return { signedOff };
    }),
});
