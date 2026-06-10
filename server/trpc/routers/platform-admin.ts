/**
 * Platform Admin — Cross-company overview for platform operators.
 *
 * Allowlist sourced from PLATFORM_ADMIN_EMAILS env var
 * (see lib/auth/platform-admin). NOT the same as adminProcedure
 * (which is company-scoped). This is a platform-level view across
 * ALL companies and users.
 */
import { desc, count, eq, sql, and, isNotNull, gte } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  user,
  company,
  companyAssessment,
  companyRequirementStatus,
  trainingLessonProgress,
  supplier,
  notification,
} from "@/schema";

const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isPlatformAdmin(ctx.session?.user.email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
  }
  return next({ ctx });
});

export const platformAdminRouter = router({
  overview: platformAdminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsersRow,
      recentUsersRow,
      totalCompaniesRow,
      usersWithCompanyRow,
      totalAssessmentsRow,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(user),
      ctx.db.select({ count: count() }).from(user).where(gte(user.createdAt, sevenDaysAgo)),
      ctx.db.select({ count: count() }).from(company),
      ctx.db.select({ count: count() }).from(user).where(isNotNull(user.companyId)),
      ctx.db.select({ count: count() }).from(companyAssessment),
    ]);

    return {
      totalUsers: totalUsersRow[0]?.count ?? 0,
      recentUsers: recentUsersRow[0]?.count ?? 0,
      totalCompanies: totalCompaniesRow[0]?.count ?? 0,
      usersWithCompany: usersWithCompanyRow[0]?.count ?? 0,
      totalAssessments: totalAssessmentsRow[0]?.count ?? 0,
    };
  }),

  /** All users with their company name and creation date, newest first */
  users: platformAdminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        companyId: user.companyId,
        companyName: company.name,
        companySector: company.sector,
        companyPlan: company.plan,
      })
      .from(user)
      .leftJoin(company, eq(user.companyId, company.id))
      .orderBy(desc(user.createdAt));

    return rows;
  }),

  /** All companies with user count and compliance progress */
  companies: platformAdminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: company.id,
        name: company.name,
        sector: company.sector,
        entityType: company.entityType,
        plan: company.plan,
        employeeCount: company.employeeCount,
        actsAsNis2Entity: company.actsAsNis2Entity,
        actsAsSupplier: company.actsAsSupplier,
        createdAt: company.createdAt,
        userCount: sql<number>`(SELECT count(*)::int FROM "user" WHERE "user"."company_id" = ${company.id})`,
        compliancePct: sql<string>`COALESCE(
          (SELECT ca.compliance_percentage FROM company_assessment ca WHERE ca.company_id = ${company.id} LIMIT 1),
          '0'
        )`,
      })
      .from(company)
      .orderBy(desc(company.createdAt));

    return rows;
  }),

  /** Compliance activity: which companies have progress on requirements */
  complianceActivity: platformAdminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        companyName: company.name,
        companyId: company.id,
        adminEmail: sql<string | null>`COALESCE(
          (SELECT u.email FROM "user" u WHERE u.company_id = ${company.id} AND u.role = 'admin' ORDER BY u.created_at ASC LIMIT 1),
          (SELECT u.email FROM "user" u WHERE u.company_id = ${company.id} ORDER BY u.created_at ASC LIMIT 1)
        )`,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) FILTER (WHERE ${companyRequirementStatus.status} IN ('completed', 'approved'))::int`,
        inProgress: sql<number>`count(*) FILTER (WHERE ${companyRequirementStatus.status} = 'in_progress')::int`,
        notStarted: sql<number>`count(*) FILTER (WHERE ${companyRequirementStatus.status} = 'not_started')::int`,
      })
      .from(companyRequirementStatus)
      .innerJoin(companyAssessment, eq(companyRequirementStatus.assessmentId, companyAssessment.id))
      .innerJoin(company, eq(companyAssessment.companyId, company.id))
      .groupBy(company.id, company.name)
      .orderBy(desc(sql`count(*) FILTER (WHERE ${companyRequirementStatus.status} IN ('completed', 'approved'))`));

    return rows;
  }),

  /**
   * Training progress across all users, broken down per course.
   *
   * Earlier the totals collapsed all courses into one `totalLessons` count,
   * which was misleading when a user had progress in multiple courses (e.g.
   * 47 CEO + 1 Tabletop showed up as "48 lessons" with no indication of
   * distribution). Per-course columns make the breakdown explicit.
   */
  trainingActivity: platformAdminProcedure.query(async ({ ctx }) => {
    const cid = trainingLessonProgress.courseId;
    const done = trainingLessonProgress.completed;
    const quiz = trainingLessonProgress.quizPassed;

    const rows = await ctx.db
      .select({
        userId: trainingLessonProgress.userId,
        userName: user.name,
        userEmail: user.email,
        companyName: company.name,
        totalLessons: sql<number>`count(*)::int`,
        completedLessons: sql<number>`count(*) FILTER (WHERE ${done} = true)::int`,
        quizzesPassed: sql<number>`count(*) FILTER (WHERE ${quiz} = true)::int`,
        ceoTouched: sql<number>`count(*) FILTER (WHERE ${cid} = 'nis2-ceo')::int`,
        ceoCompleted: sql<number>`count(*) FILTER (WHERE ${cid} = 'nis2-ceo' AND ${done} = true)::int`,
        ceoQuizzes: sql<number>`count(*) FILTER (WHERE ${cid} = 'nis2-ceo' AND ${quiz} = true)::int`,
        craTouched: sql<number>`count(*) FILTER (WHERE ${cid} = 'cra-sbom')::int`,
        craCompleted: sql<number>`count(*) FILTER (WHERE ${cid} = 'cra-sbom' AND ${done} = true)::int`,
        craQuizzes: sql<number>`count(*) FILTER (WHERE ${cid} = 'cra-sbom' AND ${quiz} = true)::int`,
        tabletopTouched: sql<number>`count(*) FILTER (WHERE ${cid} = 'nis2-tabletop')::int`,
        tabletopCompleted: sql<number>`count(*) FILTER (WHERE ${cid} = 'nis2-tabletop' AND ${done} = true)::int`,
        tabletopQuizzes: sql<number>`count(*) FILTER (WHERE ${cid} = 'nis2-tabletop' AND ${quiz} = true)::int`,
        lastActivity: sql<string>`max(${trainingLessonProgress.updatedAt})`,
      })
      .from(trainingLessonProgress)
      .innerJoin(user, eq(trainingLessonProgress.userId, user.id))
      .leftJoin(company, eq(user.companyId, company.id))
      .groupBy(trainingLessonProgress.userId, user.name, user.email, company.name)
      .orderBy(desc(sql`max(${trainingLessonProgress.updatedAt})`));

    return rows;
  }),

  /**
   * Outbound email activity + subscription state.
   *
   * Scope: emails recorded in the `notification` table (cron-driven —
   * course follow-ups, daily digests, weekly management digests, deadline
   * reminders). Transactional emails (invites, welcome, contact-change
   * notifications, supplier incident broadcasts) currently bypass the
   * notification table and are NOT counted here.
   */
  emailActivity: platformAdminProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalSentRow,
      sentLast7dRow,
      totalUsersRow,
      optedOutRow,
      recentEmails,
      optedOutUsers,
      typeBreakdown,
    ] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(notification)
        .where(
          and(eq(notification.channel, "email"), eq(notification.status, "sent")),
        ),
      ctx.db
        .select({ count: count() })
        .from(notification)
        .where(
          and(
            eq(notification.channel, "email"),
            eq(notification.status, "sent"),
            gte(notification.sentAt, sevenDaysAgo),
          ),
        ),
      ctx.db.select({ count: count() }).from(user),
      ctx.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.emailFollowupsDisabled, true)),
      ctx.db
        .select({
          id: notification.id,
          sentAt: notification.sentAt,
          subject: notification.subject,
          entityType: notification.entityType,
          triggerField: notification.triggerField,
          recipientUserEmail: user.email,
          recipientEmailExternal: notification.recipientEmail,
          companyName: company.name,
        })
        .from(notification)
        .leftJoin(user, eq(notification.recipientId, user.id))
        .leftJoin(company, eq(notification.companyId, company.id))
        .where(
          and(eq(notification.channel, "email"), eq(notification.status, "sent")),
        )
        .orderBy(desc(notification.sentAt))
        .limit(100),
      ctx.db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: company.name,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .leftJoin(company, eq(user.companyId, company.id))
        .where(eq(user.emailFollowupsDisabled, true))
        .orderBy(desc(user.updatedAt)),
      ctx.db
        .select({
          entityType: notification.entityType,
          c: count(),
        })
        .from(notification)
        .where(
          and(eq(notification.channel, "email"), eq(notification.status, "sent")),
        )
        .groupBy(notification.entityType),
    ]);

    return {
      totalSent: totalSentRow[0]?.count ?? 0,
      sentLast7d: sentLast7dRow[0]?.count ?? 0,
      totalUsers: totalUsersRow[0]?.count ?? 0,
      optedOut: optedOutRow[0]?.count ?? 0,
      typeBreakdown: typeBreakdown.map((r) => ({ type: r.entityType, count: r.c })),
      recentEmails: recentEmails.map((r) => ({
        id: r.id,
        sentAt: r.sentAt,
        subject: r.subject,
        entityType: r.entityType,
        triggerField: r.triggerField,
        recipientEmail: r.recipientUserEmail ?? r.recipientEmailExternal,
        companyName: r.companyName,
      })),
      optedOutUsers,
    };
  }),

  /** Supplier portal activity — companies acting as suppliers */
  supplierActivity: platformAdminProcedure.query(async ({ ctx }) => {
    // Companies that act as suppliers and their relationship count
    const rows = await ctx.db
      .select({
        companyId: company.id,
        companyName: company.name,
        sector: company.sector,
        createdAt: company.createdAt,
        customerCount: sql<number>`(
          SELECT count(*)::int FROM supplier
          WHERE supplier.supplier_company_id = ${company.id}
        )`,
      })
      .from(company)
      .where(eq(company.actsAsSupplier, true))
      .orderBy(desc(company.createdAt));

    return rows;
  }),
});
