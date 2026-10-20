import "@/lib/server-guard";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  or,
  sql,
} from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { betweenDays } from "@/lib/platform-admin/users";
import { auditLog, company, trainingLessonProgress, user } from "@/schema";
import { isoZ } from "./common";

/**
 * Signals that people are stuck or using the product in a way it was not built for, read from
 * what is already recorded. None of them proves a bug; each is a place to look, with the numbers
 * that make it worth looking. Every query is bounded: counts per group and at most a few dozen
 * rows. Free text people typed (descriptions) is returned as data, never as instructions.
 */

export interface Days {
  readonly fromDay?: string;
  readonly toDay?: string;
}

const inRange = (d: Days) => betweenDays(auditLog.createdAt, d.fromDay, d.toDay);

/** Items people put on hold ("Geht noch nicht") and why: where the walkthrough asks too much. */
const parkedItems = (db: DbOrTx, d: Days) =>
  db
    .select({
      item: auditLog.description,
      reason: sql<string | null>`${auditLog.newValue}->>'reason'`,
      times: count(),
      people: countDistinct(auditLog.userId),
      companies: countDistinct(auditLog.companyId),
    })
    .from(auditLog)
    .where(and(eq(auditLog.action, "durchgang.waiting"), inRange(d)))
    .groupBy(auditLog.description, sql`${auditLog.newValue}->>'reason'`)
    .orderBy(desc(count()))
    .limit(25);

/** Items a company decided not to do: where the product asks for something people refuse. */
const declinedItems = (db: DbOrTx, d: Days) =>
  db
    .select({
      item: auditLog.description,
      times: count(),
      companies: countDistinct(auditLog.companyId),
    })
    .from(auditLog)
    .where(and(eq(auditLog.action, "durchgang.declined"), inRange(d)))
    .groupBy(auditLog.description)
    .orderBy(desc(count()))
    .limit(25);

/** Signatures taken back, by what took them: work that had to be redone. */
const lostSignOffs = (db: DbOrTx, d: Days) =>
  db
    .select({
      action: auditLog.action,
      example: sql<string>`min(${auditLog.description})`,
      times: count(),
      companies: countDistinct(auditLog.companyId),
    })
    .from(auditLog)
    .where(
      and(
        inArray(auditLog.action, [
          "requirement.sign_off_invalidated",
          "requirement.sign_off_withdrawn",
        ]),
        inRange(d),
      ),
    )
    .groupBy(auditLog.action)
    .orderBy(desc(count()));

/**
 * The same person saving the same record over and over: six or more times in the range, a sign
 * they cannot get it right, or that a save does not do what they expect.
 */
const repeatedSaves = (db: DbOrTx, d: Days) =>
  db
    .select({
      userId: auditLog.userId,
      email: user.email,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      companyName: sql<string | null>`min(${company.name})`,
      times: count(),
      first: isoZ(sql`min(${auditLog.createdAt})`),
      last: isoZ(sql`max(${auditLog.createdAt})`),
    })
    .from(auditLog)
    .innerJoin(user, eq(user.id, auditLog.userId))
    .leftJoin(company, eq(company.id, auditLog.companyId))
    .where(and(isNotNull(auditLog.entityId), inRange(d)))
    .groupBy(
      auditLog.userId,
      user.email,
      auditLog.action,
      auditLog.entityType,
      auditLog.entityId,
    )
    .having(sql`count(*) >= 6`)
    .orderBy(desc(count()))
    .limit(30);

/** Mail the product tried to send and could not, by kind. */
const failures = (db: DbOrTx, d: Days) =>
  db
    .select({
      action: auditLog.action,
      times: count(),
      example: sql<string>`min(${auditLog.description})`,
    })
    .from(auditLog)
    .where(
      and(
        or(like(auditLog.action, "email.%failed"), like(auditLog.action, "cron.%error")),
        inRange(d),
      ),
    )
    .groupBy(auditLog.action)
    .orderBy(desc(count()));

/** Per lesson: how many started, finished, took the quiz and failed it. Where a course loses people. */
const lessonTrouble = (db: DbOrTx, d: Days) =>
  db
    .select({
      courseId: trainingLessonProgress.courseId,
      lessonId: trainingLessonProgress.lessonId,
      started: countDistinct(trainingLessonProgress.userId),
      finished: sql<number>`count(distinct ${trainingLessonProgress.userId}) filter (where ${trainingLessonProgress.completed})::int`,
      quizTaken: sql<number>`count(*) filter (where ${trainingLessonProgress.quizScore} is not null)::int`,
      quizFailed: sql<number>`count(*) filter (where ${trainingLessonProgress.quizPassed} = false)::int`,
      averageScore: sql<
        number | null
      >`round(avg(${trainingLessonProgress.quizScore}))::int`,
    })
    .from(trainingLessonProgress)
    .where(betweenDays(trainingLessonProgress.updatedAt, d.fromDay, d.toDay))
    .groupBy(trainingLessonProgress.courseId, trainingLessonProgress.lessonId)
    .having(sql`count(distinct ${trainingLessonProgress.userId}) >= 3`)
    .orderBy(
      sql`(count(distinct ${trainingLessonProgress.userId}) filter (where ${trainingLessonProgress.completed}))::float / count(distinct ${trainingLessonProgress.userId})`,
    )
    .limit(25);

/** Verified people who came back more than once and still have no activated company. */
const stuckBeforeSetup = (db: DbOrTx, d: Days) =>
  db
    .select({
      id: user.id,
      email: user.email,
      signedUp: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      logins: user.loginCount,
      hasCompany: sql<boolean>`${user.companyId} is not null`,
    })
    .from(user)
    .leftJoin(company, eq(company.id, user.companyId))
    .where(
      and(
        isNotNull(user.emailVerifiedAt),
        gte(user.loginCount, 2),
        isNull(company.activatedAt),
        betweenDays(user.createdAt, d.fromDay, d.toDay),
      ),
    )
    .orderBy(desc(user.loginCount))
    .limit(30);

/** How much assistants did, and for how many people. */
const assistantUse = (db: DbOrTx, d: Days) =>
  db
    .select({
      action: auditLog.action,
      times: count(),
      people: countDistinct(auditLog.userId),
      companies: countDistinct(auditLog.companyId),
    })
    .from(auditLog)
    .where(and(like(auditLog.action, "mcp.%"), inRange(d)))
    .groupBy(auditLog.action)
    .orderBy(desc(count()));

export async function problemAreas(db: DbOrTx, d: Days) {
  const [parked, declined, lost, repeated, failed, lessons, stuck, assistants] =
    await Promise.all([
      parkedItems(db, d),
      declinedItems(db, d),
      lostSignOffs(db, d),
      repeatedSaves(db, d),
      failures(db, d),
      lessonTrouble(db, d),
      stuckBeforeSetup(db, d),
      assistantUse(db, d),
    ]);
  return {
    range: d,
    note: "Signals, not proof of bugs. Each list is capped; look at the people and companies behind the biggest numbers with user_overview, company_overview and event_log.",
    parkedItems: parked,
    declinedItems: declined,
    lostSignOffs: lost,
    repeatedSaves: repeated,
    mailAndJobFailures: failed,
    weakestLessons: lessons,
    verifiedButNeverSetUp: stuck,
    assistantUse: assistants,
  };
}
