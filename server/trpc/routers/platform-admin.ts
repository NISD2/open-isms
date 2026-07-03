/**
 * Platform Admin — Cross-company overview for platform operators.
 *
 * Allowlist sourced from PLATFORM_ADMIN_EMAILS env var
 * (see lib/auth/platform-admin). NOT the same as adminProcedure
 * (which is company-scoped). This is a platform-level view across
 * ALL companies and users.
 */
import { desc, count, eq, sql, and, isNotNull, gte } from "drizzle-orm";
import { z } from "zod";
import { randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
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
  gapAssessment,
  dataErasureLog,
} from "@/schema";
import { computeScores } from "@/lib/gap-assessment/scoring";
import { getGapAssessmentData, answerMapSchema } from "@/lib/gap-assessment";
import { logAudit } from "@/lib/audit";
import { eraseUser, previewUserErasure } from "@/lib/gdpr/erase-user";
import { buildErasureCertificate, erasureCertificateFilename } from "@/lib/gdpr/certificate";
import { rateLimit } from "@/lib/rate-limit";

// Character set (not a secret) for human-friendly share passwords —
// confusable chars (0, O, I, l, 1) intentionally excluded so the password
// can be typed without ambiguity. `gitleaks:allow` flags it as a known
// safe constant so EW-16's scan doesn't trip on the high-entropy alphabet.
const SHARE_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // gitleaks:allow

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
        })
        .returning({ id: company.id });
      if (!newCompany) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Company insert returned no rows" });
      }

      const [assessment] = await ctx.db
        .insert(gapAssessment)
        .values({
          userId: ctx.userId,
          companyId: newCompany.id,
        })
        .returning({ id: gapAssessment.id });
      if (!assessment) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Assessment insert returned no rows" });
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
          message: "Cannot publish an assessment with no answers. Fill in at least one question first.",
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
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      // Never erase a peer platform admin from this tool: it is irreversible and
      // can tear down a company. Deallowlist them and handle it deliberately.
      if (isPlatformAdmin(target.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Refusing to erase a platform-admin account. Remove them from PLATFORM_ADMIN_EMAILS first.",
        });
      }
      if (target.email.trim().toLowerCase() !== input.confirmEmail.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmation email does not match the account.",
        });
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
