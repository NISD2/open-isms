/**
 * Platform growth analytics — the data behind the Graphs tab.
 *
 * Two shapes come back:
 *
 *  - **Fact rows**, one per user and one per company, carrying only what a
 *    chart needs (calendar days, flags, counts — no names, no addresses).
 *    Every signup curve, funnel, cohort and distribution on the tab is folded
 *    out of these on the client, so one range filter scopes all of them and
 *    two cards can never disagree about the same number.
 *  - **Daily series** for the things that are not per-user facts (lessons
 *    completed, requirement work, leads, mail), pre-grouped in SQL.
 *
 * Both are all-time. The client picks the range and the bucket size, so
 * switching "last 30 days" to "all time" is instant and never refetches.
 *
 * Every day is a UTC calendar day rendered by `to_char` on a bare timestamp
 * column. Those columns store UTC wall time, so this groups by UTC day with no
 * timezone math, and shipping strings rather than Date objects stops the
 * client re-interpreting them in the viewer's zone.
 */

import { and, eq, inArray, isNotNull, type SQLWrapper, sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  questionnaireColumns,
  questionnaireCompleteness,
} from "@/lib/supplier-portal/completeness";
import { COURSE_IDS, loadCourse } from "@/lib/training/course-loader";
import {
  company,
  companyRequirementStatus,
  evidence,
  lead,
  notification,
  signOffHistory,
  trainingLessonProgress,
  user,
} from "@/schema";

export type CourseId = (typeof COURSE_IDS)[number];

/** The UTC calendar day a bare timestamp column falls on. */
const dayOf = (column: SQLWrapper) => sql<string>`to_char(${column}, 'YYYY-MM-DD')`;
/** Same, for a nullable column — a NULL timestamp gives a NULL day. */
const nullableDayOf = (column: SQLWrapper) =>
  sql<string | null>`to_char(${column}, 'YYYY-MM-DD')`;

// ---------------------------------------------------------------------------
// Returned shapes
// ---------------------------------------------------------------------------

export interface UserFact {
  /** UTC day the account was created. */
  signupDay: string;
  /** Has proved control of the address (signup OTP or Google). */
  verified: boolean;
  /** Signed up from a domain on the disposable-address blocklist. */
  disposable: boolean;
  /** Stored UI language, or "unknown" for accounts predating the column. */
  locale: string;
  /** Attached to a company row, activated or still a draft shell. */
  inOrg: boolean;
  /** Day their org was activated; null while it is still a draft shell. */
  activatedDay: string | null;
  /**
   * Every day carrying at least one work event, oldest first. Days rather than
   * months because the client needs both: the first entry is time-to-first-
   * value, a range slice is "active people this week", and the months they
   * fall in are the cohort grid. Short for almost everyone.
   */
  activeDays: string[];
  /**
   * Recorded work events, all time: lesson progress, requirement completions,
   * sign-offs and evidence uploads. Deliberately not the audit log, which
   * records crons, outbound mail and admin actions, so a count built on it
   * would read our own batch jobs as customers being busy.
   */
  workEvents: number;
  /**
   * The same count without lesson progress: requirement completions, sign-offs
   * and evidence only. Someone who finished a 47-lesson course has 47 work
   * events and may still have done nothing at all inside their ISMS, which is
   * a different and more interesting fact.
   */
  complianceEvents: number;
  /** Requirements this person signed off, all time. */
  signOffs: number;
  /** Courses with at least one lesson touched. */
  coursesStarted: CourseId[];
  /** Courses finished, with the day the last lesson was completed. */
  coursesFinished: Array<{ courseId: CourseId; day: string }>;
}

export interface CompanyFact {
  createdDay: string;
  /** Null means a draft shell: provisioned at signup, never named. */
  activatedDay: string | null;
  sector: string;
  /** ISO 3166-1 alpha-2, or null when the org never filled it in. */
  country: string | null;
  entityType: string;
  plan: string;
  employeeCount: number | null;
  actsAsSupplier: boolean;
  actsAsNis2Entity: boolean;
  /** Accounts attached to this org. */
  seats: number;
  /** NIS 2 compliance percentage, 0-100. Zero for orgs with no assessment. */
  compliancePct: number;
  /**
   * Share of the supplier questionnaire answered, 0-100, counting only the
   * questions that apply to them. Null for companies that are not suppliers,
   * so they never land in the supplier distribution as a zero.
   */
  questionnairePct: number | null;
}

export interface DailyCourseRow {
  day: string;
  ceo: number;
  cra: number;
  tabletop: number;
}

export interface DailyWorkRow {
  day: string;
  /** Requirements marked complete that day. */
  completed: number;
  /** Requirement sign-offs recorded that day. */
  signedOff: number;
  /** Evidence files uploaded that day. */
  evidence: number;
}

export interface DailyActivityRow {
  day: string;
  /** Distinct people with at least one work event that day. */
  users: number;
  /** Work events that day. */
  events: number;
}

export interface DailyLeadRow {
  day: string;
  total: number;
  entity: number;
  supplier: number;
  both: number;
  unknown: number;
}

export interface DailyEmailRow {
  day: string;
  sent: number;
}

export interface GrowthData {
  users: UserFact[];
  companies: CompanyFact[];
  /** Lessons completed per day, split by course. */
  lessons: DailyCourseRow[];
  /** Compliance work recorded per day. */
  work: DailyWorkRow[];
  /** Distinct active people and their event count per day. */
  activity: DailyActivityRow[];
  /** Applicability-check leads per day, split by declared intent. */
  leads: DailyLeadRow[];
  /** Outbound email per day, same scope as the Emails tab. */
  emails: DailyEmailRow[];
  /** Lesson count per course, so "x of y" can never drift from the course. */
  courseLessonCounts: Record<CourseId, number>;
}

/** Which DailyCourseRow column a course id writes to. */
const COURSE_COLUMN = {
  "nis2-ceo": "ceo",
  "cra-sbom": "cra",
  "nis2-tabletop": "tabletop",
} as const satisfies Record<CourseId, keyof Omit<DailyCourseRow, "day">>;

const asCourseId = (value: string): CourseId | null =>
  COURSE_IDS.find((id) => id === value) ?? null;

// ---------------------------------------------------------------------------
// The query
// ---------------------------------------------------------------------------

export async function loadGrowthData(db: Database): Promise<GrowthData> {
  const courses = await Promise.all(
    COURSE_IDS.map(async (courseId) => ({
      courseId,
      lessonIds: (await loadCourse(courseId)).modules.flatMap((m) => m.lessonIds),
    })),
  );

  const [
    userRows,
    companyRows,
    lessonTouches,
    lessonCompletions,
    signOffRows,
    evidenceRows,
    requirementRows,
    leadRows,
    emailRows,
    courseFinishRows,
  ] = await Promise.all([
    db
      .select({
        id: user.id,
        signupDay: dayOf(user.createdAt),
        verified: sql<boolean>`${user.emailVerifiedAt} IS NOT NULL`,
        disposable: user.isDisposableEmail,
        locale: user.locale,
        companyId: user.companyId,
        activatedDay: nullableDayOf(company.activatedAt),
      })
      .from(user)
      .leftJoin(company, eq(user.companyId, company.id)),

    db
      .select({
        ...questionnaireColumns(),
        createdDay: dayOf(company.createdAt),
        activatedDay: nullableDayOf(company.activatedAt),
        sector: company.sector,
        country: company.country,
        entityType: company.entityType,
        plan: company.plan,
        employeeCount: company.employeeCount,
        actsAsSupplier: company.actsAsSupplier,
        actsAsNis2Entity: company.actsAsNis2Entity,
        // "company"."id" is written out rather than interpolated as
        // ${company.id}: Drizzle only qualifies a column with its table when
        // the outer query has a join, and this one selects from `company`
        // alone, so the interpolation would render as a bare "id" that binds
        // to the SUBQUERY's table. Same trap the Companies tab hit.
        seats: sql<number>`(SELECT count(*)::int FROM "user" u WHERE u.company_id = "company"."id")`,
        compliancePct: sql<number>`COALESCE(
          (SELECT ca.compliance_percentage::float8
             FROM company_assessment ca
             JOIN compliance_framework cf ON cf.id = ca.framework_id
            WHERE ca.company_id = "company"."id" AND cf.code = 'nis2'
            LIMIT 1),
          0
        )`,
      })
      .from(company),

    // Engagement, keyed on updatedAt: opening a lesson and failing its quiz is
    // still someone doing the course. Completion is counted separately below.
    db
      .select({
        userId: trainingLessonProgress.userId,
        courseId: trainingLessonProgress.courseId,
        day: dayOf(trainingLessonProgress.updatedAt),
        events: sql<number>`count(*)::int`,
      })
      .from(trainingLessonProgress)
      .groupBy(
        trainingLessonProgress.userId,
        trainingLessonProgress.courseId,
        dayOf(trainingLessonProgress.updatedAt),
      ),

    db
      .select({
        courseId: trainingLessonProgress.courseId,
        day: dayOf(trainingLessonProgress.completedAt),
        completed: sql<number>`count(*)::int`,
      })
      .from(trainingLessonProgress)
      .where(
        and(
          eq(trainingLessonProgress.completed, true),
          isNotNull(trainingLessonProgress.completedAt),
        ),
      )
      .groupBy(
        trainingLessonProgress.courseId,
        dayOf(trainingLessonProgress.completedAt),
      ),

    db
      .select({
        userId: signOffHistory.signedOffBy,
        day: dayOf(signOffHistory.createdAt),
        events: sql<number>`count(*)::int`,
      })
      .from(signOffHistory)
      .groupBy(signOffHistory.signedOffBy, dayOf(signOffHistory.createdAt)),

    db
      .select({
        userId: evidence.uploadedBy,
        day: dayOf(evidence.uploadedAt),
        events: sql<number>`count(*)::int`,
      })
      .from(evidence)
      .where(isNotNull(evidence.uploadedBy))
      .groupBy(evidence.uploadedBy, dayOf(evidence.uploadedAt)),

    db
      .select({
        userId: companyRequirementStatus.completedBy,
        day: dayOf(companyRequirementStatus.completedAt),
        events: sql<number>`count(*)::int`,
      })
      .from(companyRequirementStatus)
      .where(
        and(
          isNotNull(companyRequirementStatus.completedBy),
          isNotNull(companyRequirementStatus.completedAt),
        ),
      )
      .groupBy(
        companyRequirementStatus.completedBy,
        dayOf(companyRequirementStatus.completedAt),
      ),

    db
      .select({
        day: dayOf(lead.createdAt),
        intent: lead.intent,
        total: sql<number>`count(*)::int`,
      })
      .from(lead)
      .groupBy(dayOf(lead.createdAt), lead.intent),

    db
      .select({
        day: dayOf(notification.sentAt),
        sent: sql<number>`count(*)::int`,
      })
      .from(notification)
      .where(
        and(
          eq(notification.channel, "email"),
          eq(notification.status, "sent"),
          isNotNull(notification.sentAt),
        ),
      )
      .groupBy(dayOf(notification.sentAt)),

    // Finished = every lesson of the CURRENT course definition completed, the
    // same test certificate eligibility uses, so progress on a since-removed
    // lesson cannot inflate the count. The day is the last completion;
    // COALESCE to updatedAt covers rows completed before completedAt was
    // stamped, which keeps this set identical to the overview KPI's.
    Promise.all(
      courses.map(async ({ courseId, lessonIds }) => {
        const rows = await db
          .select({
            userId: trainingLessonProgress.userId,
            day: sql<string>`to_char(COALESCE(max(${trainingLessonProgress.completedAt}), max(${trainingLessonProgress.updatedAt})), 'YYYY-MM-DD')`,
          })
          .from(trainingLessonProgress)
          .where(
            and(
              eq(trainingLessonProgress.courseId, courseId),
              eq(trainingLessonProgress.completed, true),
              inArray(trainingLessonProgress.lessonId, lessonIds),
            ),
          )
          .groupBy(trainingLessonProgress.userId)
          .having(
            sql`count(distinct ${trainingLessonProgress.lessonId}) = ${lessonIds.length}`,
          );
        return rows.map((r) => ({ courseId, userId: r.userId, day: r.day }));
      }),
    ),
  ]);

  // ── Per-user work, folded from the four sources ───────────────────────────

  interface UserWork {
    events: number;
    complianceEvents: number;
    signOffs: number;
    days: Set<string>;
  }
  const workByUser = new Map<string, UserWork>();
  const activeByDay = new Map<string, { users: Set<string>; events: number }>();

  /**
   * Which kind of work a row is. Lesson progress and ISMS work are both work,
   * but they answer different questions: "did this person come back" counts
   * both, while "did the course turn into anything" has to count only the
   * second, or every course finisher looks busy on the strength of the 47
   * lessons they just clicked through.
   */
  const recordWork = (
    row: { userId: string | null; day: string; events: number },
    kind: "lesson" | "compliance" | "sign-off",
  ) => {
    if (!row.userId) return;
    const forUser: UserWork = workByUser.get(row.userId) ?? {
      events: 0,
      complianceEvents: 0,
      signOffs: 0,
      days: new Set(),
    };
    forUser.events += row.events;
    if (kind !== "lesson") forUser.complianceEvents += row.events;
    if (kind === "sign-off") forUser.signOffs += row.events;
    forUser.days.add(row.day);
    workByUser.set(row.userId, forUser);

    const forDay = activeByDay.get(row.day) ?? { users: new Set<string>(), events: 0 };
    forDay.users.add(row.userId);
    forDay.events += row.events;
    activeByDay.set(row.day, forDay);
  };

  for (const r of lessonTouches) recordWork(r, "lesson");
  for (const r of signOffRows) recordWork(r, "sign-off");
  for (const r of evidenceRows) recordWork(r, "compliance");
  for (const r of requirementRows) recordWork(r, "compliance");

  const startedByUser = new Map<string, Set<CourseId>>();
  for (const r of lessonTouches) {
    const courseId = asCourseId(r.courseId);
    if (!courseId) continue;
    const started = startedByUser.get(r.userId) ?? new Set<CourseId>();
    started.add(courseId);
    startedByUser.set(r.userId, started);
  }

  const finishedByUser = new Map<string, Array<{ courseId: CourseId; day: string }>>();
  for (const row of courseFinishRows.flat()) {
    const finished = finishedByUser.get(row.userId) ?? [];
    finished.push({ courseId: row.courseId, day: row.day });
    finishedByUser.set(row.userId, finished);
  }

  const users: UserFact[] = userRows.map((u) => {
    const work = workByUser.get(u.id);
    return {
      signupDay: u.signupDay,
      verified: u.verified,
      disposable: u.disposable,
      locale: u.locale ?? "unknown",
      inOrg: u.companyId !== null,
      activatedDay: u.activatedDay,
      activeDays: work ? Array.from(work.days).sort() : [],
      workEvents: work?.events ?? 0,
      complianceEvents: work?.complianceEvents ?? 0,
      signOffs: work?.signOffs ?? 0,
      coursesStarted: Array.from(startedByUser.get(u.id) ?? []),
      coursesFinished: finishedByUser.get(u.id) ?? [],
    };
  });

  // ── Daily series ──────────────────────────────────────────────────────────

  const lessonsByDay = new Map<string, DailyCourseRow>();
  for (const r of lessonCompletions) {
    const courseId = asCourseId(r.courseId);
    if (!courseId) continue;
    const row = lessonsByDay.get(r.day) ?? { day: r.day, ceo: 0, cra: 0, tabletop: 0 };
    row[COURSE_COLUMN[courseId]] += r.completed;
    lessonsByDay.set(r.day, row);
  }

  const workByDay = new Map<string, DailyWorkRow>();
  const addWork = (
    day: string,
    key: "completed" | "signedOff" | "evidence",
    n: number,
  ) => {
    const row = workByDay.get(day) ?? { day, completed: 0, signedOff: 0, evidence: 0 };
    row[key] += n;
    workByDay.set(day, row);
  };
  for (const r of requirementRows) addWork(r.day, "completed", r.events);
  for (const r of signOffRows) addWork(r.day, "signedOff", r.events);
  for (const r of evidenceRows) addWork(r.day, "evidence", r.events);

  const leadsByDay = new Map<string, DailyLeadRow>();
  for (const r of leadRows) {
    const row = leadsByDay.get(r.day) ?? {
      day: r.day,
      total: 0,
      entity: 0,
      supplier: 0,
      both: 0,
      unknown: 0,
    };
    row.total += r.total;
    row[r.intent] += r.total;
    leadsByDay.set(r.day, row);
  }

  const byDay = <T extends { day: string }>(rows: Iterable<T>): T[] =>
    Array.from(rows).sort((a, b) => a.day.localeCompare(b.day));

  return {
    users,
    // Scored from the whole row, not from a rest-spread of "everything that
    // was not named above". `country` is both a questionnaire field and a
    // column this query selects for the country chart, so destructuring it out
    // deleted it from the answers and scored every supplier one field short —
    // which showed up as the Graphs tab and the Suppliers tab reporting
    // different medians for the same five suppliers.
    companies: companyRows.map((row) => ({
      createdDay: row.createdDay,
      activatedDay: row.activatedDay,
      sector: row.sector,
      country: row.country,
      entityType: row.entityType,
      plan: row.plan,
      employeeCount: row.employeeCount,
      actsAsSupplier: row.actsAsSupplier,
      actsAsNis2Entity: row.actsAsNis2Entity,
      seats: row.seats,
      compliancePct: Number(row.compliancePct),
      questionnairePct: row.actsAsSupplier
        ? questionnaireCompleteness(row).percent
        : null,
    })),
    lessons: byDay(lessonsByDay.values()),
    work: byDay(workByDay.values()),
    activity: byDay(
      Array.from(activeByDay, ([day, v]) => ({
        day,
        users: v.users.size,
        events: v.events,
      })),
    ),
    leads: byDay(leadsByDay.values()),
    emails: byDay(emailRows.map((r) => ({ day: r.day, sent: r.sent }))),
    courseLessonCounts: Object.fromEntries(
      courses.map(({ courseId, lessonIds }) => [courseId, lessonIds.length]),
    ) as Record<CourseId, number>,
  };
}
