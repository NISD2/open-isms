/**
 * The database side of the close-sync (./sync): who to sync with what facts, and
 * what was last written to Close. Every read covers all verified accounts, which
 * at a few thousand people is cheaper than being clever.
 */
import "@/lib/server-guard";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { DbOrTx } from "@/lib/db";
import { isFeatureOn } from "@/lib/feature-flags";
import { SCOPE_ALL } from "@/lib/mail/consent-rules";
import { type COURSE_IDS, loadCourse } from "@/lib/training/course-loader";
import {
  billingAccount,
  closeCrmSync,
  company,
  companyAssessment,
  companyMembership,
  companyRequirementStatus,
  complianceFramework,
  emailPreference,
  requirement,
  trainingLessonProgress,
  user,
} from "@/schema";
import { NIS2_FRAMEWORK_CODE } from "@/server/trpc/helpers/nis2-scope";
import { closeFactsFor } from "./facts";
import { type CloseSyncStore, MAX_REFUSALS } from "./sync";

const CEO_COURSE_ID = "nis2-ceo" satisfies (typeof COURSE_IDS)[number];

/** Postgres 23503, directly or wrapped by drizzle as the error's cause. */
const isForeignKeyViolation = (err: unknown): boolean => {
  const code = (e: unknown) =>
    e && typeof e === "object" && "code" in e ? String(e.code) : undefined;
  const cause = err && typeof err === "object" && "cause" in err ? err.cause : undefined;
  return code(err) === "23503" || code(cause) === "23503";
};

/**
 * Verified, real accounts with their open company, its billing level and the sync
 * row. The company counts only through a membership and a billing account, the same
 * joins the session's openMembership (lib/auth/config.ts) makes.
 */
const verifiedUsers = (db: DbOrTx) =>
  db
    .select({
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
      grandfatheredAt: user.grandfatheredAt,
      emailFollowupsDisabled: user.emailFollowupsDisabled,
      companyId: companyMembership.companyId,
      company: {
        name: company.name,
        sector: company.sector,
        employeeCount: company.employeeCount,
        country: company.country,
        actsAsSupplier: company.actsAsSupplier,
      },
      accessLevel: billingAccount.accessLevel,
      sync: {
        leadId: closeCrmSync.leadId,
        contactId: closeCrmSync.contactId,
        createdLead: closeCrmSync.createdLead,
        fieldsHash: closeCrmSync.fieldsHash,
        rejectedCount: closeCrmSync.rejectedCount,
      },
    })
    .from(user)
    .leftJoin(
      companyMembership,
      and(
        eq(companyMembership.userId, user.id),
        eq(companyMembership.companyId, user.companyId),
      ),
    )
    .leftJoin(company, eq(company.id, companyMembership.companyId))
    .leftJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .leftJoin(closeCrmSync, eq(closeCrmSync.userId, user.id))
    .where(and(isNotNull(user.emailVerifiedAt), eq(user.isDisposableEmail, false)));

/** People who opted out of every optional email. */
const optedOutOfAll = (db: DbOrTx) =>
  db
    .select({ userId: emailPreference.userId })
    .from(emailPreference)
    .where(eq(emailPreference.scope, SCOPE_ALL));

const ceoCourseProgress = (db: DbOrTx) =>
  db
    .select({
      userId: trainingLessonProgress.userId,
      lessonId: trainingLessonProgress.lessonId,
      completed: trainingLessonProgress.completed,
      completedAt: trainingLessonProgress.completedAt,
    })
    .from(trainingLessonProgress)
    .where(eq(trainingLessonProgress.courseId, CEO_COURSE_ID));

/** Every company's NIS 2 path in one read (~49 rows a company), summarised in memory. */
const nis2PathRows = (db: DbOrTx) =>
  db
    .select({
      companyId: companyAssessment.companyId,
      status: companyRequirementStatus.status,
      code: requirement.code,
    })
    .from(companyRequirementStatus)
    .innerJoin(
      companyAssessment,
      eq(companyRequirementStatus.assessmentId, companyAssessment.id),
    )
    .innerJoin(
      complianceFramework,
      and(
        eq(complianceFramework.id, companyAssessment.frameworkId),
        eq(complianceFramework.code, NIS2_FRAMEWORK_CODE),
      ),
    )
    .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id));

export const closeSyncStore = (db: DbOrTx): CloseSyncStore => ({
  erased: () =>
    db
      .select({
        id: closeCrmSync.id,
        leadId: closeCrmSync.leadId,
        contactId: closeCrmSync.contactId,
        createdLead: closeCrmSync.createdLead,
      })
      .from(closeCrmSync)
      .where(isNull(closeCrmSync.userId)),

  people: async () => {
    const [users, optedOut, ceoProgress, pathRows, launched, ceoCourse] =
      await Promise.all([
        verifiedUsers(db),
        optedOutOfAll(db),
        ceoCourseProgress(db),
        nis2PathRows(db),
        isFeatureOn(db, "billing"),
        loadCourse(CEO_COURSE_ID),
      ]);

    const factsOf = closeFactsFor({
      optedOutUserIds: new Set(optedOut.map((row) => row.userId)),
      ceoLessonIds: ceoCourse.modules.flatMap((m) => m.lessonIds),
      ceoProgress,
      pathRows,
      launched,
    });
    return users.map((row) => ({
      userId: row.userId,
      email: row.email,
      name: row.name,
      facts: factsOf(row),
      sync: row.sync,
    }));
  },

  linked: async (userId, link, createdLead, fieldsHash) => {
    const state = {
      leadId: link.leadId,
      contactId: link.contactId,
      createdLead,
      fieldsHash,
      syncedAt: new Date(),
      rejectedCount: 0,
      lastError: null,
      updatedAt: new Date(),
    };
    await db
      .insert(closeCrmSync)
      .values({ userId, ...state })
      .onConflictDoUpdate({ target: closeCrmSync.userId, set: state })
      .catch(async (err: unknown) => {
        if (!isForeignKeyViolation(err)) throw err;
        // Erased while this run was writing them to Close: queue the deletion.
        await db.insert(closeCrmSync).values({ userId: null, ...state });
      });
  },

  refused: async (userId, detail, giveUp) => {
    const lastError = detail.slice(0, 200);
    await db
      .insert(closeCrmSync)
      .values({ userId, rejectedCount: giveUp ? MAX_REFUSALS : 1, lastError })
      .onConflictDoUpdate({
        target: closeCrmSync.userId,
        set: {
          rejectedCount: giveUp ? MAX_REFUSALS : sql`${closeCrmSync.rejectedCount} + 1`,
          lastError,
          updatedAt: new Date(),
        },
      })
      .catch((err: unknown) => {
        // Erased meanwhile: nothing of theirs is in Close to keep track of.
        if (!isForeignKeyViolation(err)) throw err;
      });
  },

  forget: async (rowId) => {
    await db.delete(closeCrmSync).where(eq(closeCrmSync.id, rowId));
  },

  optOut: async (emails) => {
    const people = await db
      .select({ id: user.id, companyId: user.companyId })
      .from(user)
      .where(inArray(sql`lower(${user.email})`, [...new Set(emails)]));
    if (people.length === 0) return 0;
    // The same row an unsubscribe writes, so the mail consent gate honours it;
    // source "crm" tells it apart from the person's own choice.
    const added = await db
      .insert(emailPreference)
      .values(people.map((p) => ({ userId: p.id, scope: SCOPE_ALL, source: "crm" })))
      .onConflictDoNothing()
      .returning({ userId: emailPreference.userId });
    const companyOf = new Map(people.map((p) => [p.id, p.companyId]));
    for (const row of added) {
      logAudit({
        companyId: companyOf.get(row.userId) ?? null,
        userId: row.userId,
        action: "email.unsubscribed_scope",
        entityType: "user",
        entityId: row.userId,
        description:
          "All optional email switched off: sales marked the person as objecting in Close",
      });
    }
    return added.length;
  },
});
