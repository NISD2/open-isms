/**
 * Platform Admin — Cross-company overview for platform operators.
 *
 * Allowlist sourced from PLATFORM_ADMIN_EMAILS env var
 * (see lib/auth/platform-admin). NOT the same as adminProcedure
 * (which is company-scoped). This is a platform-level view across
 * ALL companies and users.
 */

import { randomBytes, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, count, desc, eq, gte, inArray, isNotNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { compileDailyDigest, compileManagementDigest } from "@/lib/compliance/digest";
import type { Database } from "@/lib/db";
import { mailSupportEmail } from "@/lib/env";
import { answerMapSchema, getGapAssessmentData } from "@/lib/gap-assessment";
import { computeScores } from "@/lib/gap-assessment/scoring";
import {
  buildErasureCertificate,
  erasureCertificateFilename,
} from "@/lib/gdpr/certificate";
import { eraseUser, previewUserErasure } from "@/lib/gdpr/erase-user";
import { runLifecycleEmails } from "@/lib/lifecycle/dispatch";
import { prepareActivationNudgeSample } from "@/lib/lifecycle/emails/activation-nudge";
import { LIFECYCLE_ENTITY_TYPE } from "@/lib/lifecycle/types";
import { loadEmailConsent } from "@/lib/mail/consent";
import {
  buildDigestQueue,
  type DigestKind,
  sendDigestBatch,
} from "@/lib/mail/digest-outbox";
import { EMAIL_FAILURE_ACTION } from "@/lib/mail/failure-log";
import { preferenceFooterFor } from "@/lib/mail/footer";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { isSuppressedSendId, sendMail } from "@/lib/mail/send";
import { dailyDigestEmail, weeklyManagementDigestEmail } from "@/lib/mail/templates";
import { HINT_COLUMN, HINTS, resolveHints } from "@/lib/onboarding/hints";
import { rateLimit } from "@/lib/rate-limit";
import { COURSE_IDS, loadCourse } from "@/lib/training/course-loader";
import {
  auditLog,
  company,
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
  dataErasureLog,
  emailPreference,
  gapAssessment,
  notification,
  trainingLessonProgress,
  user,
} from "@/schema";
import { NIS2_FRAMEWORK_CODE } from "../helpers/nis2-scope";
import { protectedProcedure, router } from "../init";

/**
 * Sends to one recipient in one UTC day at which the email dashboard flags
 * the row. Three legitimate producers can coincide once (daily digest,
 * course follow-up, lifecycle nudge); reaching this level repeatedly means
 * a producer is misbehaving.
 */
const MULTI_SEND_ALERT_PER_DAY = 3;

/** Compile and render one digest for one user, or null when there is nothing to say. */
async function buildDigestContent(
  db: Database,
  userId: string,
  companyId: string,
  kind: DigestKind,
): Promise<{ subject: string; html: string; text: string } | null> {
  const [recipient, co] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, userId), columns: { locale: true } }),
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { country: true },
    }),
  ]);

  const footer = preferenceFooterFor(
    userId,
    kind === "daily" ? "reminders.daily_digest" : "reminders.weekly_management_digest",
    resolveEmailLocale(recipient?.locale ?? null, co?.country ?? null),
  );
  if (kind === "daily") {
    const d = await compileDailyDigest(db, userId, companyId);
    if (!d) return null;
    return dailyDigestEmail({
      recipientName: d.recipientName,
      companyName: d.companyName,
      overdueItems: d.overdueItems,
      urgentItems: d.urgentItems,
      upcomingItems: d.upcomingItems,
      nextStep: d.nextStep,
      compliancePercentage: d.compliancePercentage,
      dashboardUrl: d.dashboardUrl,
      footer,
    });
  }
  const m = await compileManagementDigest(db, userId, companyId);
  if (!m) return null;
  return weeklyManagementDigestEmail({
    recipientName: m.recipientName,
    companyName: m.companyName,
    compliancePercentage: m.compliancePercentage,
    overdueCount: m.overdueCount,
    urgentCount: m.urgentCount,
    escalationCount: m.escalationCount,
    totalRequirements: m.totalRequirements,
    completedRequirements: m.completedRequirements,
    nextStep: m.nextStep,
    dashboardUrl: m.dashboardUrl,
    footer,
  });
}

/**
 * Record a [Test] send in the notification table so the activity view (graph,
 * totals, recent list) counts every email that actually left the building.
 * Not a claim: internal.test_send is under no dedup index and no campaign
 * reads it, so admins can test as often as they like. Best-effort — the
 * bookkeeping row must never fail a test send that already went out.
 */
async function logTestSend(
  db: Database,
  userId: string,
  companyId: string,
  info: { subject: string; triggerField: string },
): Promise<void> {
  const now = new Date();
  await db
    .insert(notification)
    .values({
      companyId,
      recipientId: userId,
      entityType: "internal.test_send",
      entityId: userId,
      triggerField: info.triggerField,
      subject: info.subject,
      channel: "email" as const,
      status: "sent" as const,
      scheduledFor: now,
      sentAt: now,
      urgency: "info" as const,
      escalationLevel: 0,
    })
    .catch(() => {});
}

// Character set (not a secret) for human-friendly share passwords —
// confusable chars (0, O, I, l, 1) intentionally excluded so the password
// can be typed without ambiguity. `gitleaks:allow` flags it as a known
// safe constant so EW-16's scan doesn't trip on the high-entropy alphabet.
const SHARE_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // gitleaks:allow

function generateSharePassword(): string {
  const bytes = randomBytes(12);
  let out = "";
  for (const byte of bytes) {
    out += SHARE_PASSWORD_ALPHABET[byte % SHARE_PASSWORD_ALPHABET.length];
  }
  return out;
}

const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isPlatformAdmin(ctx.session?.user.email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
  }
  return next({ ctx });
});

export const platformAdminRouter = router({
  /**
   * The caller's own resettable state, for the personal dev tab.
   *
   * Scoped to ctx.userId throughout: the admin gate decides who may reach the
   * tab, and every read and write here is fixed to the caller's own row. No
   * procedure in this group takes an id that could point at somebody else.
   */
  myDevState: platformAdminProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.userId),
      columns: {
        loginCount: true,
        journeyTourDismissedAt: true,
        requirementTourDismissedAt: true,
        helpOfferDismissedAt: true,
      },
    });
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "User row missing" });

    const progress = await ctx.db
      .select({
        courseId: trainingLessonProgress.courseId,
        lessons: count(),
      })
      .from(trainingLessonProgress)
      .where(eq(trainingLessonProgress.userId, ctx.userId))
      .groupBy(trainingLessonProgress.courseId);

    return {
      ...row,
      // The panel feeds this straight back into trainingMarkCourseComplete,
      // which already takes a userId, so "complete my course" needs no
      // procedure of its own.
      userId: ctx.userId,
      hints: resolveHints(row),
      courses: COURSE_IDS.map((courseId) => ({
        courseId,
        lessons: progress.find((p) => p.courseId === courseId)?.lessons ?? 0,
      })),
    };
  }),

  /**
   * Re-arm one of the one-time onboarding surfaces for the caller.
   *
   * Takes which surface because the two cannot both be armed: resolveHints
   * gates the tours on `loginCount <= 1` and the offer of help on
   * `loginCount >= 2`, so arming either means moving the counter to a value
   * that disarms the other. Clearing the dismissal stamp alone would do
   * nothing on an account that has signed in more than once.
   *
   * Self-scoped, so the worst it can do is show the caller a tour.
   */
  armOnboardingSurface: platformAdminProcedure
    .input(z.object({ surface: z.enum(HINTS) }))
    .mutation(async ({ ctx, input }) => {
      // Both tours want a first-login account; the offer of help wants a
      // second. Everything else is just clearing that surface's own stamp.
      //
      // The tours arm at 0, not 1, so that arming survives a sign-out. The
      // jwt callback increments this on every sign-in, so parking it on the
      // last value that still counts as a first login meant "arm it, log out,
      // log back in" landed on 2 and silently disarmed the thing that had
      // just been armed. From 0 the next sign-in lands on 1 and the tour is
      // still there, which is how the reset is actually used.
      const loginCount = input.surface === "helpOffer" ? 2 : 0;
      await ctx.db
        .update(user)
        .set({ loginCount, [HINT_COLUMN[input.surface]]: null })
        .where(eq(user.id, ctx.userId));
      return { surface: input.surface };
    }),

  /**
   * Drop the caller's lesson progress for one course so it can be walked
   * again from the start.
   *
   * Deliberately leaves `training_record` alone. That row is the company's
   * §38 BSIG training evidence, not a per-user replay flag, and a dev tool
   * has no business deleting compliance evidence.
   */
  resetMyCourseProgress: platformAdminProcedure
    .input(z.object({ courseId: z.enum(COURSE_IDS) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(trainingLessonProgress)
        .where(
          and(
            eq(trainingLessonProgress.userId, ctx.userId),
            eq(trainingLessonProgress.courseId, input.courseId),
          ),
        )
        .returning({ id: trainingLessonProgress.id });
      return { courseId: input.courseId, removed: deleted.length };
    }),

  overview: platformAdminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // "Finished" = same definition as certificate eligibility
    // (trainingCertificate.getCourseCompletion): every lesson of the CURRENT
    // course definition completed — hence the lessonId membership filter, so
    // progress on since-removed lessons cannot inflate the count.
    const ceoLessonIds = (await loadCourse("nis2-ceo")).modules.flatMap(
      (m) => m.lessonIds,
    );

    const [
      totalUsersRow,
      recentUsersRow,
      totalCompaniesRow,
      activatedCompaniesRow,
      usersWithActivatedCompanyRow,
      totalAssessmentsRow,
      ceoFinishedRows,
      ceoStartedRow,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(user),
      ctx.db
        .select({ count: count() })
        .from(user)
        .where(gte(user.createdAt, sevenDaysAgo)),
      ctx.db.select({ count: count() }).from(company),
      // Real orgs = activated (non-draft) companies. Every verified user now
      // auto-gets a draft shell, so a raw company/companyId count no longer
      // measures real activation — filter on activatedAt.
      ctx.db
        .select({ count: count() })
        .from(company)
        .where(isNotNull(company.activatedAt)),
      ctx.db
        .select({ count: count() })
        .from(user)
        .innerJoin(company, eq(user.companyId, company.id))
        .where(isNotNull(company.activatedAt)),
      ctx.db.select({ count: count() }).from(companyAssessment),
      ctx.db
        .select({ userId: trainingLessonProgress.userId })
        .from(trainingLessonProgress)
        .where(
          and(
            eq(trainingLessonProgress.courseId, "nis2-ceo"),
            eq(trainingLessonProgress.completed, true),
            inArray(trainingLessonProgress.lessonId, ceoLessonIds),
          ),
        )
        .groupBy(trainingLessonProgress.userId)
        .having(
          sql`count(distinct ${trainingLessonProgress.lessonId}) = ${ceoLessonIds.length}`,
        ),
      ctx.db
        .select({
          count: sql<number>`count(distinct ${trainingLessonProgress.userId})::int`,
        })
        .from(trainingLessonProgress)
        .where(eq(trainingLessonProgress.courseId, "nis2-ceo")),
    ]);

    const totalCompanies = totalCompaniesRow[0]?.count ?? 0;
    const activatedCompanies = activatedCompaniesRow[0]?.count ?? 0;

    return {
      totalUsers: totalUsersRow[0]?.count ?? 0,
      recentUsers: recentUsersRow[0]?.count ?? 0,
      totalCompanies,
      // Activated (named) orgs — the activation KPI. draftCompanies is the
      // funnel gap: verified users who provisioned a shell but never activated.
      activatedCompanies,
      draftCompanies: Math.max(0, totalCompanies - activatedCompanies),
      usersWithActivatedCompany: usersWithActivatedCompanyRow[0]?.count ?? 0,
      totalAssessments: totalAssessmentsRow[0]?.count ?? 0,
      ceoCourseFinished: ceoFinishedRows.length,
      ceoCourseStarted: ceoStartedRow[0]?.count ?? 0,
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
        activatedAt: company.activatedAt,
        createdAt: company.createdAt,
        // "company"."id" is written out rather than interpolated as
        // ${company.id}. Drizzle only qualifies a column with its table when
        // the outer query has a join; this one selects from `company` alone,
        // so the interpolation renders as a bare "id". Inside these correlated
        // subqueries that bare name binds to the SUBQUERY's own table, which
        // silently made both of these compare a row's id to its own foreign
        // key (always false: userCount 0, compliancePct '0' for every row),
        // and became an outright "column reference id is ambiguous" error the
        // moment the compliance_framework join below put a second id in scope.
        userCount: sql<number>`(SELECT count(*)::int FROM "user" u WHERE u.company_id = "company"."id")`,
        // NIS 2 only. LIMIT 1 with no ORDER BY and no framework predicate
        // returned an arbitrary framework's percentage for the Companies tab.
        compliancePct: sql<string>`COALESCE(
          (SELECT ca.compliance_percentage
             FROM company_assessment ca
             JOIN compliance_framework cf ON cf.id = ca.framework_id
            WHERE ca.company_id = "company"."id" AND cf.code = 'nis2'
            LIMIT 1),
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
      .innerJoin(
        companyAssessment,
        eq(companyRequirementStatus.assessmentId, companyAssessment.id),
      )
      .innerJoin(company, eq(companyAssessment.companyId, company.id))
      // NIS 2 only. Without this the totals read 101 or 103 per company -- the
      // sum of every framework a tenant was ever provisioned -- and understate
      // real NIS 2 progress by roughly half. Inline rather than via
      // getNis2AssessmentIds because this query spans all companies at once.
      .innerJoin(
        complianceFramework,
        and(
          eq(companyAssessment.frameworkId, complianceFramework.id),
          eq(complianceFramework.code, NIS2_FRAMEWORK_CODE),
        ),
      )
      .groupBy(company.id, company.name)
      .orderBy(
        desc(
          sql`count(*) FILTER (WHERE ${companyRequirementStatus.status} IN ('completed', 'approved'))`,
        ),
      );

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
   * Support tool: mark every lesson of a course complete for a user.
   * Grant-only by design — it never un-completes or deletes progress, and
   * existing completedAt timestamps are preserved so a genuine completion
   * date is not overwritten by a later admin action. Caveat: quizzes stay
   * unpassed, and a learner who later FAILS a quiz retake flips that
   * lesson back to incomplete (submitQuiz behavior), which re-locks the
   * certificate until the quiz is passed or the course is re-granted.
   */
  trainingMarkCourseComplete: platformAdminProcedure
    .input(z.object({ userId: z.string().uuid(), courseId: z.enum(COURSE_IDS) }))
    .mutation(async ({ ctx, input }) => {
      const course = await loadCourse(input.courseId);
      const lessonIds = course.modules.flatMap((m) => m.lessonIds);

      const target = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.userId),
        columns: { id: true, companyId: true, email: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const now = new Date();
      await ctx.db
        .insert(trainingLessonProgress)
        .values(
          lessonIds.map((lessonId) => ({
            userId: target.id,
            companyId: target.companyId,
            courseId: course.id,
            lessonId,
            completed: true,
            completedAt: now,
          })),
        )
        .onConflictDoUpdate({
          target: [
            trainingLessonProgress.userId,
            trainingLessonProgress.courseId,
            trainingLessonProgress.lessonId,
          ],
          set: {
            completed: true,
            completedAt: sql`COALESCE(${trainingLessonProgress.completedAt}, excluded.completed_at)`,
            updatedAt: now,
          },
        });

      await logAudit({
        companyId: target.companyId,
        userId: ctx.userId,
        action: "training.admin_complete_course",
        entityType: "user",
        entityId: target.id,
        description: `Admin marked course ${course.id} (${lessonIds.length} lessons) complete for ${target.email}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { courseId: course.id, lessonCount: lessonIds.length };
    }),

  /**
   * Outbound email activity + subscription state.
   *
   * Scope: emails recorded in the `notification` table (cron-driven —
   * course follow-ups, daily digests, weekly management digests, deadline
   * reminders, lifecycle nudges). Transactional emails (invites, welcome,
   * contact-change notifications, supplier incident broadcasts) currently
   * bypass the notification table and are NOT counted here.
   *
   * Caveat for lifecycle rows (entityType "lifecycle_email"): they record
   * CLAIMS, not confirmed deliveries — the row is written status "sent"
   * before the transport call, and a failed send keeps it (marked
   * urgency "warning", plus an email.lifecycle_failed audit row). Counts
   * here therefore read a failed nudge as sent; the warning marker is the
   * reconciliation signal.
   */
  emailActivity: platformAdminProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSentRow,
      sentLast7dRow,
      totalUsersRow,
      optedOutRow,
      recentEmails,
      optedOutUsers,
      typeBreakdown,
      dailyVolumeRows,
      recipientDayRows,
      lifecycleFailedRow,
      failedSends,
    ] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(notification)
        .where(and(eq(notification.channel, "email"), eq(notification.status, "sent"))),
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
        .where(and(eq(notification.channel, "email"), eq(notification.status, "sent")))
        .orderBy(desc(notification.sentAt))
        .limit(100),
      // Everyone who has switched something off: the legacy all-off boolean
      // OR any per-scope row. A person with only scope rows is just as
      // unsubscribed as one with the boolean, and the admin view has to show
      // both or the resubscribe button will not find them.
      ctx.db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: company.name,
          updatedAt: user.updatedAt,
          allOff: user.emailFollowupsDisabled,
          scopes: sql<
            string[]
          >`COALESCE(array_agg(${emailPreference.scope}) FILTER (WHERE ${emailPreference.scope} IS NOT NULL), '{}')`,
        })
        .from(user)
        .leftJoin(company, eq(user.companyId, company.id))
        .leftJoin(emailPreference, eq(emailPreference.userId, user.id))
        .where(
          or(eq(user.emailFollowupsDisabled, true), isNotNull(emailPreference.scope)),
        )
        .groupBy(user.id, user.email, user.name, company.name, user.updatedAt)
        .orderBy(desc(user.updatedAt)),
      ctx.db
        .select({
          entityType: notification.entityType,
          c: count(),
        })
        .from(notification)
        .where(and(eq(notification.channel, "email"), eq(notification.status, "sent")))
        .groupBy(notification.entityType),
      // Daily send volume, last 14 days. sent_at stores UTC wall time, so
      // to_char on the bare column groups by UTC day without timezone math.
      ctx.db
        .select({
          day: sql<string>`to_char(${notification.sentAt}, 'YYYY-MM-DD')`,
          c: count(),
        })
        .from(notification)
        .where(
          and(
            eq(notification.channel, "email"),
            eq(notification.status, "sent"),
            gte(notification.sentAt, fourteenDaysAgo),
          ),
        )
        .groupBy(sql`to_char(${notification.sentAt}, 'YYYY-MM-DD')`),
      // Per-recipient per-day counts, last 7 days — raw material for the
      // over-mailing view. Recipient identity: portal user email when the
      // row has a recipientId, the external address otherwise.
      //
      // COUNT(DISTINCT entity_type), not COUNT(*): a notification row is not
      // an email. The deadline cron writes one row per requirement and then
      // sends ONE digest covering all of them; the course cron writes one row
      // per stalled course and sends ONE email listing them. Counting rows
      // told the operator that somebody with twelve due requirements had been
      // mailed twelve times, which would fire the over-mailing flag on a
      // person who received a single message. Each producer sends at most one
      // email per recipient per day, so distinct producers per day IS the
      // number of emails that day.
      ctx.db
        .select({
          recipient: sql<string>`COALESCE(${user.email}, ${notification.recipientEmail}, 'unknown')`,
          day: sql<string>`to_char(${notification.sentAt}, 'YYYY-MM-DD')`,
          c: sql<number>`count(DISTINCT ${notification.entityType})::int`,
        })
        .from(notification)
        .leftJoin(user, eq(notification.recipientId, user.id))
        .where(
          and(
            eq(notification.channel, "email"),
            eq(notification.status, "sent"),
            gte(notification.sentAt, sevenDaysAgo),
          ),
        )
        .groupBy(
          sql`COALESCE(${user.email}, ${notification.recipientEmail}, 'unknown')`,
          sql`to_char(${notification.sentAt}, 'YYYY-MM-DD')`,
        ),
      // Lifecycle claims kept after a failed transport send (the dispatcher
      // marks them urgency 'warning') — the reconciliation signal for rows
      // this view would otherwise count as delivered.
      ctx.db
        .select({ count: count() })
        .from(notification)
        .where(
          and(
            eq(notification.entityType, LIFECYCLE_ENTITY_TYPE),
            eq(notification.urgency, "warning"),
          ),
        ),
      // Mail that did not go out. sendMail records one of these on every
      // failure path, so this list does not depend on a caller having
      // remembered to check the return value.
      ctx.db
        .select({
          id: auditLog.id,
          createdAt: auditLog.createdAt,
          description: auditLog.description,
          companyName: company.name,
        })
        .from(auditLog)
        .leftJoin(company, eq(auditLog.companyId, company.id))
        .where(
          and(
            eq(auditLog.action, EMAIL_FAILURE_ACTION),
            gte(auditLog.createdAt, thirtyDaysAgo),
          ),
        )
        .orderBy(desc(auditLog.createdAt))
        .limit(50),
    ]);

    // Fold per-day recipient counts into totals plus the busiest single day.
    // MULTI_SEND_ALERT_PER_DAY is the "someone should look" line: a digest,
    // a course follow-up and a lifecycle nudge can legitimately coincide on
    // one day, but hitting that level repeatedly means a producer misbehaves.
    const byRecipient = new Map<string, { total: number; maxPerDay: number }>();
    for (const row of recipientDayRows) {
      const entry = byRecipient.get(row.recipient) ?? { total: 0, maxPerDay: 0 };
      entry.total += row.c;
      if (row.c > entry.maxPerDay) entry.maxPerDay = row.c;
      byRecipient.set(row.recipient, entry);
    }
    const allRecipients = Array.from(byRecipient, ([recipient, v]) => ({
      recipient,
      ...v,
    }));
    // Count the flagged over the WHOLE set before truncating. Sorting by
    // total and slicing first hid exactly the case the flag exists for: a
    // person mailed four times in one day but only four times all week ranks
    // below twenty steady recipients and fell off the list, taking the alert
    // with it — the badge could read zero while someone was being spammed.
    const flaggedCount = allRecipients.filter(
      (r) => r.maxPerDay >= MULTI_SEND_ALERT_PER_DAY,
    ).length;
    // Flagged rows first, so anything worth acting on is always visible.
    const frequentRecipients = allRecipients
      .sort(
        (a, b) =>
          Number(b.maxPerDay >= MULTI_SEND_ALERT_PER_DAY) -
            Number(a.maxPerDay >= MULTI_SEND_ALERT_PER_DAY) ||
          b.maxPerDay - a.maxPerDay ||
          b.total - a.total,
      )
      .slice(0, 20);

    // Stable 14-slot series: quiet days render as zero-height bars instead
    // of disappearing, so a gap reads as a gap.
    const volumeByDay = new Map(dailyVolumeRows.map((r) => [r.day, r.c]));
    const dailyVolume = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return { day, count: volumeByDay.get(day) ?? 0 };
    });

    return {
      dailyVolume,
      frequentRecipients,
      /** Flagged across ALL recipients, not just the twenty listed above. */
      flaggedRecipientCount: flaggedCount,
      multiSendAlertPerDay: MULTI_SEND_ALERT_PER_DAY,
      lifecycleFailed: lifecycleFailedRow[0]?.count ?? 0,
      failedSends: failedSends.map((r) => ({
        id: r.id,
        at: r.createdAt,
        description: r.description,
        companyName: r.companyName,
      })),
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

  /**
   * Send the activation nudge to the CALLING platform admin's own mailbox,
   * subject-prefixed [Test]. Renders through the real campaign code (their
   * own journey numbers when available, marked sample values otherwise) but
   * writes NO claim row and checks NO eligibility — the once-ever guarantee
   * for the real campaign is untouched, and the admin can send themselves
   * as many tests as they like. Same shape as newsletter.sendTest. Note the
   * footer unsubscribe link is live: clicking it in the test opts the admin
   * out of follow-up emails like any other user.
   */
  sendLifecycleTestEmail: platformAdminProcedure.mutation(async ({ ctx }) => {
    const sample = await prepareActivationNudgeSample(ctx.db, ctx.userId);
    if (!sample) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Calling user not found." });
    }
    // Sent as the REAL message type, so the consent gate applies exactly as it
    // would to a customer. An earlier version sent this as internal.test_send
    // to guarantee the admin saw it; that made the test useless as a test —
    // it delivered to an admin who had unsubscribed, which reads as a broken
    // unsubscribe rather than as a bypass. Refusing and saying why is more
    // honest, and the caller can resubscribe themselves in one click.
    const consent = await loadEmailConsent(ctx.db, ctx.userId);
    if (!consent.allows("product.lifecycle_nudge")) {
      return {
        to: sample.to,
        sent: false as const,
        reason: "opted-out" as const,
        suppressed: false,
      };
    }
    const res = await sendMail({
      emailType: "product.lifecycle_nudge",
      recipientUserId: ctx.userId,
      db: ctx.db,
      to: sample.to,
      subject: `[Test] ${sample.subject}`,
      html: sample.html,
      text: sample.text,
      replyTo: mailSupportEmail(),
    });
    if (!res.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Test send failed.",
      });
    }
    // res.id carries a sentinel instead of a Resend id when delivery was
    // suppressed (dev block / DISABLE_EMAIL / no API key).
    const suppressed = "id" in res ? isSuppressedSendId(res.id) : false;
    if (!suppressed) {
      const caller = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { companyId: true },
      });
      if (caller?.companyId) {
        await logTestSend(ctx.db, ctx.userId, caller.companyId, {
          subject: `[Test] ${sample.subject}`,
          triggerField: "activation_nudge_v1",
        });
      }
    }
    return {
      to: sample.to,
      sent: true as const,
      reason: null,
      suppressed,
    };
  }),

  /**
   * Who the activation nudge would go to right now, without sending.
   *
   * The same selection the sender uses, run in dry-run mode, so the list an
   * operator approves is the list that ships — not a second implementation
   * of "who is eligible" that could drift from the first.
   */
  lifecycleQueue: platformAdminProcedure.query(async ({ ctx }) => {
    const result = await runLifecycleEmails(ctx.db, { dryRun: true });
    if (result.skipped !== undefined) {
      return { available: false as const, reason: result.skipped, types: [] };
    }
    return {
      available: true as const,
      reason: null,
      types: Object.entries(result.types).map(([key, stats]) => ({
        key,
        prepared: stats.prepared,
        error: stats.error ?? null,
        recipients: (stats.wouldSend ?? []).map((r) => ({
          userId: r.userId,
          to: r.to,
          subject: r.subject,
        })),
      })),
    };
  }),

  /**
   * Send the next `limit` queued lifecycle emails, oldest-dormant first.
   *
   * Manual by design: nisd2.eu does not schedule the lifecycle cron, so
   * nothing leaves the building unless a person presses the button. The
   * at-most-once claim still guards every recipient, so pressing twice
   * cannot double-send — the second press simply finds fewer people queued.
   */
  sendLifecycleBatch: platformAdminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const result = await runLifecycleEmails(ctx.db, { maxPerType: input.limit });
      logAudit({
        companyId: null,
        userId: ctx.userId,
        action: "email.lifecycle_batch_sent",
        entityType: "system",
        entityId: null,
        description: `Platform admin sent a lifecycle batch (limit ${input.limit}): ${JSON.stringify(result, (k, v) => (k === "wouldSend" ? undefined : v))}`,
      });
      if (result.skipped !== undefined) {
        return { skipped: result.skipped, sent: 0, failed: 0, deferred: 0 };
      }
      const totals = Object.values(result.types).reduce(
        (acc, s) => ({
          sent: acc.sent + s.sent,
          failed: acc.failed + s.failed,
          deferred: acc.deferred + s.deferred,
        }),
        { sent: 0, failed: 0, deferred: 0 },
      );
      return { skipped: null, ...totals };
    }),

  /**
   * The deadline digests waiting to go out, with the numbers each one would
   * carry. Same builder the sender uses, so the list is the list.
   */
  digestQueue: platformAdminProcedure.query(async ({ ctx }) => {
    const queue = await buildDigestQueue(ctx.db);
    return {
      total: queue.length,
      items: queue.map((q) => ({
        kind: q.kind,
        userId: q.userId,
        email: q.email,
        companyName: q.companyName,
        subject: q.subject,
        summary: q.summary,
      })),
    };
  }),

  /** Send the first `limit` queued digests. Manual by design; see the outbox. */
  sendDigestBatch: platformAdminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      return sendDigestBatch(ctx.db, input.limit, ctx.userId);
    }),

  /**
   * The per-row "Send" button: one queued lifecycle recipient, nobody else.
   * Same selection, same once-ever claim — the run is simply narrowed to
   * this user, so a stale row (someone who became ineligible since the page
   * loaded) sends nothing rather than sending wrongly.
   */
  sendLifecycleToUser: platformAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await runLifecycleEmails(ctx.db, {
        onlyUserId: input.userId,
        maxPerType: 1,
      });
      logAudit({
        companyId: null,
        userId: ctx.userId,
        action: "email.lifecycle_batch_sent",
        entityType: "system",
        entityId: null,
        description: `Platform admin sent a single lifecycle email to user ${input.userId}: ${JSON.stringify(result, (k, v) => (k === "wouldSend" ? undefined : v))}`,
      });
      if (result.skipped !== undefined) {
        return { skipped: result.skipped, sent: 0, failed: 0 };
      }
      const totals = Object.values(result.types).reduce(
        (acc, s) => ({ sent: acc.sent + s.sent, failed: acc.failed + s.failed }),
        { sent: 0, failed: 0 },
      );
      return { skipped: null, ...totals };
    }),

  /**
   * The per-row "Send" button for one queued digest. The queue is rebuilt and
   * narrowed to this (recipient, kind); the per-day claim still arbitrates,
   * so a double-click cannot double-send.
   */
  sendDigestToRecipient: platformAdminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        kind: z.enum(["daily", "weekly"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return sendDigestBatch(ctx.db, 1, ctx.userId, {
        userId: input.userId,
        kind: input.kind as DigestKind,
      });
    }),

  /**
   * Send the daily or weekly digest to the CALLING admin's own mailbox,
   * subject-prefixed [Test]. Rendered from the admin's own company state via
   * the real compilers; writes no per-day claim, so it never blocks the real
   * digest, and the consent gate applies exactly as it would to a customer.
   * Logged as internal.test_send so the activity view counts it.
   */
  sendDigestTestEmail: platformAdminProcedure
    .input(z.object({ kind: z.enum(["daily", "weekly"]) }))
    .mutation(async ({ ctx, input }) => {
      const caller = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { email: true, companyId: true },
      });
      if (!caller) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calling user not found." });
      }
      if (!caller.companyId) {
        return {
          to: caller.email,
          sent: false as const,
          reason: "no-company" as const,
          suppressed: false,
        };
      }
      const emailType =
        input.kind === "daily"
          ? ("reminders.daily_digest" as const)
          : ("reminders.weekly_management_digest" as const);
      const consent = await loadEmailConsent(ctx.db, ctx.userId);
      if (!consent.allows(emailType)) {
        return {
          to: caller.email,
          sent: false as const,
          reason: "opted-out" as const,
          suppressed: false,
        };
      }
      const content = await buildDigestContent(
        ctx.db,
        ctx.userId,
        caller.companyId,
        input.kind,
      );
      if (!content) {
        return {
          to: caller.email,
          sent: false as const,
          reason: "no-content" as const,
          suppressed: false,
        };
      }
      const res = await sendMail({
        emailType,
        recipientUserId: ctx.userId,
        db: ctx.db,
        to: caller.email,
        subject: `[Test] ${content.subject}`,
        html: content.html,
        text: content.text,
        replyTo: mailSupportEmail(),
      });
      if (!res.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Test send failed.",
        });
      }
      const suppressed = "id" in res ? isSuppressedSendId(res.id) : false;
      if (!suppressed) {
        await logTestSend(ctx.db, ctx.userId, caller.companyId, {
          subject: `[Test] ${content.subject}`,
          triggerField: `${input.kind}_digest`,
        });
      }
      return { to: caller.email, sent: true as const, reason: null, suppressed };
    }),

  /**
   * The rendered HTML of one email template, for the "Preview" button.
   * Rendered from the calling admin's own data through the same code the
   * real send uses, returned to the client, never sent anywhere.
   */
  emailPreview: platformAdminProcedure
    .input(
      z.object({
        template: z.enum(["activation-nudge", "daily-digest", "weekly-digest"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.template === "activation-nudge") {
        const sample = await prepareActivationNudgeSample(ctx.db, ctx.userId);
        if (!sample) {
          return { html: null, subject: null, reason: "Calling user not found." };
        }
        return { html: sample.html, subject: sample.subject, reason: null };
      }
      const caller = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { companyId: true },
      });
      if (!caller?.companyId) {
        return {
          html: null,
          subject: null,
          reason: "Your account has no company, so there is no digest to render.",
        };
      }
      const kind: DigestKind = input.template === "daily-digest" ? "daily" : "weekly";
      const content = await buildDigestContent(
        ctx.db,
        ctx.userId,
        caller.companyId,
        kind,
      );
      if (!content) {
        return {
          html: null,
          subject: null,
          reason:
            "Your company has nothing to report right now, so this digest renders empty. It looks the same for customers: no content, no send.",
        };
      }
      return { html: content.html, subject: content.subject, reason: null };
    }),

  /**
   * Put somebody back on the list, by hand.
   *
   * Clears both switches: the legacy all-off boolean and every per-scope
   * opt-out row. Anything less would leave a person who looks resubscribed
   * in the admin view still silently filtered at send time.
   *
   * This is an operator override of a recipient's own choice, so it writes an
   * audit row naming the admin who did it. Use it for people who ask to come
   * back, not to undo unsubscribes in bulk.
   */
  resubscribeUser: platformAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.userId),
        columns: { id: true, email: true, companyId: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      await ctx.db
        .update(user)
        .set({ emailFollowupsDisabled: false, updatedAt: new Date() })
        .where(eq(user.id, target.id));
      const removed = await ctx.db
        .delete(emailPreference)
        .where(eq(emailPreference.userId, target.id))
        .returning({ id: emailPreference.id });

      logAudit({
        companyId: target.companyId,
        userId: ctx.userId,
        action: "email.resubscribed_by_admin",
        entityType: "user",
        entityId: target.id,
        description: `Platform admin resubscribed ${target.email} to all optional email (${removed.length} scope opt-out(s) cleared)`,
      });
      return { email: target.email, scopesCleared: removed.length };
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

  gapAssessmentCreateForCompany: platformAdminProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(255),
        sector: z.string().min(1).max(255),
        entityType: z.enum(["essential", "important", "kritis"]),
        employeeCount: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newCompany] = await ctx.db
        .insert(company)
        .values({
          name: input.companyName,
          sector: input.sector,
          entityType: input.entityType,
          employeeCount: input.employeeCount,
          actsAsNis2Entity: true,
          // A deliberately admin-created, named prospect company — not an
          // onboarding draft shell. Stamp activated so it is counted as a real
          // org, not folded into the draft/funnel-gap metric.
          activatedAt: new Date(),
        })
        .returning({ id: company.id });
      if (!newCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Company insert returned no rows",
        });
      }

      const [assessment] = await ctx.db
        .insert(gapAssessment)
        .values({
          userId: ctx.userId,
          companyId: newCompany.id,
        })
        .returning({ id: gapAssessment.id });
      if (!assessment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Assessment insert returned no rows",
        });
      }

      return { assessmentId: assessment.id, companyId: newCompany.id };
    }),

  gapAssessmentList: platformAdminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: gapAssessment.id,
        companyId: gapAssessment.companyId,
        companyName: company.name,
        sector: company.sector,
        completedAt: gapAssessment.completedAt,
        sharedAt: gapAssessment.sharedAt,
        shareToken: gapAssessment.shareToken,
        createdAt: gapAssessment.createdAt,
      })
      .from(gapAssessment)
      .leftJoin(company, eq(gapAssessment.companyId, company.id))
      .where(eq(gapAssessment.userId, ctx.userId))
      .orderBy(desc(gapAssessment.createdAt))
      .limit(100);

    return rows;
  }),

  gapAssessmentPublish: platformAdminProcedure
    .input(z.object({ assessmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.gapAssessment.findFirst({
        where: eq(gapAssessment.id, input.assessmentId),
      });
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const answers = answerMapSchema.parse(existing.answers);
      if (Object.keys(answers).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot publish an assessment with no answers. Fill in at least one question first.",
        });
      }

      const data = getGapAssessmentData();
      const scores = computeScores(data.questions, answers);

      const shareToken = randomUUID();
      const sharePassword = generateSharePassword();
      const sharePasswordHash = await bcrypt.hash(sharePassword, 10);
      const now = new Date();

      await ctx.db
        .update(gapAssessment)
        .set({
          completedAt: existing.completedAt ?? now,
          scores,
          shareToken,
          sharePasswordHash,
          sharedAt: now,
          updatedAt: now,
        })
        .where(eq(gapAssessment.id, input.assessmentId));

      await logAudit({
        companyId: existing.companyId,
        userId: ctx.userId,
        action: "gap_assessment.publish",
        entityType: "gap_assessment",
        entityId: input.assessmentId,
        description: `Admin published gap assessment ${input.assessmentId}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        shareToken,
        sharePassword,
        shareUrl: `/gap-assessment/share/${shareToken}`,
      };
    }),

  // ── GDPR Art. 17 erasure ────────────────────────────────────────────────

  /** Blast-radius preview for the confirm dialog. No writes. */
  previewErasure: platformAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const preview = await previewUserErasure(input.userId);
      if (!preview) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return preview;
    }),

  /** Irreversibly erase a user's account and all their personal data, writing a
   *  durable erasure record. Guards: cannot erase yourself; the caller must
   *  re-type the subject's email as a typed confirmation. */
  eraseUser: platformAdminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        confirmEmail: z.string().email(),
        // Required only when the target owns their org (full-teardown case).
        confirmOrgName: z.string().max(255).optional(),
        requestReceivedAt: z.coerce.date().optional(),
        rightsInvoked: z.string().max(500).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot erase your own account from here.",
        });
      }
      // Cheap defence-in-depth cap on an irreversible operation (per operator).
      if (!rateLimit(`gdpr-erase:${ctx.userId}`, 10, 60 * 60 * 1000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Erasure rate limit reached. Wait before erasing more accounts.",
        });
      }
      const [target] = await ctx.db
        .select({ id: user.id, email: user.email, companyId: user.companyId })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      // Never erase a peer platform admin from this tool: it is irreversible and
      // can tear down a company. Deallowlist them and handle it deliberately.
      if (isPlatformAdmin(target.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Refusing to erase a platform-admin account. Remove them from PLATFORM_ADMIN_EMAILS first.",
        });
      }
      if (target.email.trim().toLowerCase() !== input.confirmEmail.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmation email does not match the account.",
        });
      }
      // If the target owns their org, erasing tears the entire org down (every
      // member + all data). Require the org name typed as a second confirmation.
      if (target.companyId) {
        const [org] = await ctx.db
          .select({ ownerId: company.ownerId, name: company.name })
          .from(company)
          .where(eq(company.id, target.companyId))
          .limit(1);
        if (org && org.ownerId === target.id) {
          if (
            !input.confirmOrgName ||
            input.confirmOrgName.trim().toLowerCase() !== org.name.trim().toLowerCase()
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "This account owns its organization; type the organization name to confirm the full teardown.",
            });
          }
        }
      }

      const result = await eraseUser({
        userId: input.userId,
        actor: { userId: ctx.userId, email: ctx.session?.user.email ?? "unknown" },
        request: {
          requestReceivedAt: input.requestReceivedAt ?? null,
          requestChannel: "email",
          rightsInvoked: input.rightsInvoked ?? null,
          notes: input.notes ?? null,
        },
      });

      await logAudit({
        companyId: null,
        userId: ctx.userId,
        action: "gdpr.erase_user",
        entityType: "user",
        entityId: input.userId,
        description: `Platform admin erased account ${input.userId} (case ${result.caseRef}, method ${result.method}${result.companyTornDown ? ", company torn down" : ""})`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return result;
    }),

  /** Erasure records, newest first, for the accountability log view. */
  listErasures: platformAdminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: dataErasureLog.id,
        caseRef: dataErasureLog.caseRef,
        subjectEmail: dataErasureLog.subjectEmail,
        subjectName: dataErasureLog.subjectName,
        companyName: dataErasureLog.companyName,
        method: dataErasureLog.method,
        companyTornDown: dataErasureLog.companyTornDown,
        erasedAt: dataErasureLog.erasedAt,
        actorEmail: dataErasureLog.actorEmail,
        retentionUntil: dataErasureLog.retentionUntil,
      })
      .from(dataErasureLog)
      .orderBy(desc(dataErasureLog.erasedAt));
  }),

  /** Render one erasure record as a downloadable Markdown certificate. */
  erasureCertificate: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(dataErasureLog)
        .where(eq(dataErasureLog.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        caseRef: row.caseRef,
        filename: erasureCertificateFilename(row),
        markdown: buildErasureCertificate(row),
      };
    }),
});
