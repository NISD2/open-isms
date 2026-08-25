import { z } from "zod";
import { eq, and, inArray, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, reviewerProcedure } from "../init";
import {
  auditLog,
  companyAssessment,
  companyRequirementStatus,
  requirement,
  user,
} from "@/schema";
import { sendMail, reviewDecisionEmail } from "@/lib/mail";
import { scheduleDeadlineReminders } from "@/lib/compliance/schedule-notifications";
import type { Database } from "@/lib/db";
import { getNis2AssessmentIds } from "../helpers/nis2-scope";

export const reviewRouter = router({
  /** All submission statuses for the reviewer's company */
  list: reviewerProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];

    const assessmentIds = await getNis2AssessmentIds(ctx.db, ctx.companyId);
    if (assessmentIds.length === 0) return [];

    // Fetch all statuses with relational joins
    const rows = await ctx.db.query.companyRequirementStatus.findMany({
      where: inArray(companyRequirementStatus.assessmentId, assessmentIds),
      columns: {
        id: true,
        status: true,
        signOffSnapshot: true,
        completedAt: true,
        completedBy: true,
        reviewedAt: true,
        reviewFeedback: true,
        signedOffBy: true,
        signedOffAt: true,
        signedOffRole: true,
        signedOffTemplateVersion: true,
      },
      with: {
        requirement: {
          columns: { code: true },
          with: {
            category: {
              columns: { slug: true, code: true },
            },
          },
        },
        reviewer: {
          columns: { name: true },
        },
        evidence: {
          columns: {
            id: true,
            fileName: true,
            fileSize: true,
            description: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: [desc(companyRequirementStatus.completedAt)],
    });

    // Collect unique completedBy user IDs for name lookup
    const submitterIds = [
      ...new Set(rows.map((r) => r.completedBy).filter((id): id is string => id != null)),
    ];
    const submitterMap = new Map<string, string>();
    if (submitterIds.length > 0) {
      const submitters = await ctx.db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, submitterIds));
      for (const s of submitters) {
        submitterMap.set(s.id, s.name);
      }
    }

    // Batch-load audit log entries for all status IDs
    const statusIds = rows.map((r) => r.id);
    const auditRows =
      statusIds.length > 0
        ? await ctx.db.query.auditLog.findMany({
            where: and(
              eq(auditLog.companyId, ctx.companyId),
              eq(auditLog.entityType, "assessment"),
              inArray(auditLog.entityId, statusIds),
            ),
            columns: {
              entityId: true,
              action: true,
              description: true,
              createdAt: true,
              userId: true,
            },
            orderBy: [desc(auditLog.createdAt)],
          })
        : [];

    // Resolve audit user names
    const auditUserIds = [
      ...new Set(auditRows.map((a) => a.userId).filter((id): id is string => id != null)),
    ];
    const auditUserMap = new Map<string, string>();
    if (auditUserIds.length > 0) {
      const auditUsers = await ctx.db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, auditUserIds));
      for (const u of auditUsers) {
        auditUserMap.set(u.id, u.name);
      }
    }

    // Group audit entries by entityId
    const auditByStatus = new Map<
      string,
      { action: string; description: string; createdAt: Date; userName: string | null }[]
    >();
    for (const a of auditRows) {
      if (!a.entityId) continue;
      const list = auditByStatus.get(a.entityId) ?? [];
      list.push({
        action: a.action,
        description: a.description,
        createdAt: a.createdAt,
        userName: a.userId ? auditUserMap.get(a.userId) ?? null : null,
      });
      auditByStatus.set(a.entityId, list);
    }

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      completedAt: r.completedAt,
      reviewedAt: r.reviewedAt,
      reviewFeedback: r.reviewFeedback,
      submitterName: r.completedBy
        ? submitterMap.get(r.completedBy) ?? null
        : null,
      reviewerName: r.reviewer?.name ?? null,
      requirementCode: r.requirement.code,
      categorySlug: r.requirement.category.slug,
      categoryCode: r.requirement.category.code,
      evidenceCount: r.evidence.length,
      signOffSnapshot: r.signOffSnapshot,
      signedOffRole: r.signedOffRole,
      signedOffAt: r.signedOffAt,
      evidence: r.evidence,
      auditLog: auditByStatus.get(r.id) ?? [],
    }));
  }),

  /** Count of submissions pending review for sidebar badge */
  countPending: reviewerProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return 0;

    const assessmentIds = await getNis2AssessmentIds(ctx.db, ctx.companyId);
    if (assessmentIds.length === 0) return 0;

    const [result] = await ctx.db
      .select({ count: count() })
      .from(companyRequirementStatus)
      .where(
        and(
          inArray(companyRequirementStatus.assessmentId, assessmentIds),
          eq(companyRequirementStatus.status, "completed"),
        ),
      );

    return result?.count ?? 0;
  }),
  /** Approve a submission */
  approve: reviewerProcedure
    .input(
      z.object({
        statusId: z.string().uuid(),
        feedback: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the status belongs to this company's assessment
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.statusId),
        columns: { assessmentId: true },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }
      const [owned] = await ctx.db
        .select({ id: companyAssessment.id })
        .from(companyAssessment)
        .where(and(eq(companyAssessment.id, statusRow.assessmentId), eq(companyAssessment.companyId, ctx.companyId)))
        .limit(1);
      if (!owned) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const [updated] = await ctx.db
        .update(companyRequirementStatus)
        .set({
          status: "approved",
          reviewedBy: ctx.userId,
          reviewedAt: new Date(),
          reviewFeedback: input.feedback ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(companyRequirementStatus.id, input.statusId),
            eq(companyRequirementStatus.status, "completed"),
          ),
        )
        .returning({ id: companyRequirementStatus.id });

      if (!updated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Submission not found or not in reviewable state",
        });
      }

      // Fire-and-forget email notification to submitter
      notifySubmitter(ctx.db, input.statusId, "approved", input.feedback);

      // Schedule next review cycle (approval restarts the deadline clock)
      if (ctx.companyId) {
        scheduleDeadlineReminders(ctx.db, {
          statusId: input.statusId,
          anchorDate: new Date(),
          companyId: ctx.companyId,
          userId: ctx.userId,
        }).catch((err) => console.error("[background] deadlines:", err));
      }

      return { statusId: updated.id };
    }),

  /** Reject a submission with required feedback */
  reject: reviewerProcedure
    .input(
      z.object({
        statusId: z.string().uuid(),
        feedback: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the status belongs to this company's assessment
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.statusId),
        columns: { assessmentId: true },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }
      const [owned] = await ctx.db
        .select({ id: companyAssessment.id })
        .from(companyAssessment)
        .where(and(eq(companyAssessment.id, statusRow.assessmentId), eq(companyAssessment.companyId, ctx.companyId)))
        .limit(1);
      if (!owned) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const [updated] = await ctx.db
        .update(companyRequirementStatus)
        .set({
          status: "rejected",
          reviewedBy: ctx.userId,
          reviewedAt: new Date(),
          reviewFeedback: input.feedback,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(companyRequirementStatus.id, input.statusId),
            eq(companyRequirementStatus.status, "completed"),
          ),
        )
        .returning({ id: companyRequirementStatus.id });

      if (!updated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Submission not found or not in reviewable state",
        });
      }

      // Fire-and-forget email notification to submitter
      notifySubmitter(ctx.db, input.statusId, "rejected", input.feedback);

      return { statusId: updated.id };
    }),
});

// ---------------------------------------------------------------------------
// Email notification helper (fire-and-forget)
// ---------------------------------------------------------------------------
async function notifySubmitter(
  db: Database,
  statusId: string,
  decision: "approved" | "rejected",
  feedback?: string | null
) {
  try {
    const status = await db.query.companyRequirementStatus.findFirst({
      where: eq(companyRequirementStatus.id, statusId),
      columns: { completedBy: true, requirementId: true },
    });
    if (!status?.completedBy) return;

    const [submitter, req] = await Promise.all([
      db.query.user.findFirst({
        where: eq(user.id, status.completedBy),
        columns: { email: true, name: true },
      }),
      db.query.requirement.findFirst({
        where: eq(requirement.id, status.requirementId),
        columns: { code: true },
      }),
    ]);
    if (!submitter?.email || !req) return;

    const requirementsEn = (await import("@/messages/requirements/en.json")).default.requirements;
    const reqKey = req.code.replace(/\./g, "_") as keyof typeof requirementsEn;
    const reqTitle = requirementsEn[reqKey]?.title ?? req.code;

    sendMail({
      to: submitter.email,
      ...reviewDecisionEmail({
        submitterName: submitter.name ?? "",
        requirementCode: req.code,
        requirementTitle: reqTitle,
        decision,
        feedback,
      }),
    });
  } catch {
    // Email is non-critical — don't fail the mutation
  }
}
