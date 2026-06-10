import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../init";
import {
  user,
  company,
  companyAssessment,
  companyRequirementStatus,
  requirementAssignment,
  evidence,
  auditLog,
  categoryAssignment,
  requirement,
  requirementCategory,
} from "@/schema";

/**
 * Dev-only router. Built into the appRouter only when NODE_ENV === "development"
 * (see ../router.ts). Provides utilities that would be unsafe to expose in
 * production builds.
 *
 * `deleteCompany` and `bumpTemplateVersion` previously lived in assessmentRouter
 * as adminProcedure with a runtime NODE_ENV guard. That violated the standing
 * rule "dev-only code must be build-time gated" and exposed two sabotage
 * primitives:
 *   - deleteCompany: tenant admin wipes own audit_log; the fire-and-forget
 *     audit middleware FK-violates on the now-deleted company row and the
 *     rejection is swallowed, leaving zero record of the delete (audit B-1).
 *   - bumpTemplateVersion: writes against the global requirement catalog and
 *     flips companyRequirementStatus.status for EVERY tenant in one
 *     statement, with no companyId filter. A NODE_ENV regression
 *     (instrumentation that mutates process.env, staging-as-prod, typo) is
 *     enough to make either reachable from any tenant admin's session
 *     (audit T-1).
 *
 * Build-gating eliminates both from the production bundle. Prod operators
 * who need template bumps run a migration / CLI script; prod tenant deletion
 * is a separate product workflow (soft-delete + statutory retention) that
 * intentionally does not exist yet.
 */
export const devRouter = router({
  /** Switch the current user's role between admin / member / reviewer */
  switchRole: protectedProcedure
    .input(z.object({ role: z.enum(["admin", "member", "reviewer", "legal_reviewer"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(user)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(user.id, ctx.userId));
      return { role: input.role };
    }),

  /**
   * Wipe the caller's tenant entirely — assessments, statuses, assignments,
   * evidence, category assignments, audit log, and the company row itself.
   * Caller's user row is preserved with companyId=null so they can re-sign-up.
   *
   * Used by AdminTestPanel's "Delete Org" button to reset between dev sessions.
   * Order is FK-safe: child rows first, then parent. The audit log is wiped
   * along with the tenant because dev resets do not preserve history; the
   * production deletion workflow (when built) will retain it for statutory
   * periods and require platform-admin co-sign.
   */
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

  /**
   * Bump template versions on global `requirement` rows and flip every
   * tenant's completed status for those requirements to "needs_review".
   * Platform-wide effect, tenant-blind — which is why it ships only in dev.
   * Production template bumps run via migration / CLI scripts.
   */
  bumpTemplateVersion: adminProcedure
    .input(z.object({ requirementIds: z.array(z.string().uuid()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
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

      return { bumped: bumpedCount, flipped: flippedCount };
    }),
});
