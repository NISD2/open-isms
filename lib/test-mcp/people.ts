import "@/lib/server-guard";
import { and, count, desc, eq, ilike, inArray, max, min, or, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { literal } from "@/lib/platform-admin/users";
import { courseCompletion } from "@/lib/training/completion";
import { COURSE_IDS, loadCourse } from "@/lib/training/course-loader";
import {
  auditLog,
  company,
  mcpConnection,
  signOffHistory,
  trainingLessonProgress,
  user,
} from "@/schema";

/** Read-only facts about people for the test endpoint, for one person or a company's members. */

/** Where a person stands in one course they touched. Finished means every current lesson done. */
export interface CourseStanding {
  readonly courseId: string;
  readonly lessonsDone: number;
  readonly lessonsTotal: number;
  readonly quizzesPassed: number;
  readonly finished: boolean;
  /** The last lesson's completion; null until finished. */
  readonly finishedAt: Date | null;
  readonly lastActivityAt: Date;
}

const latest = (dates: readonly Date[]): Date =>
  dates.reduce((a, b) => (b > a ? b : a), new Date(0));

/** Each person's courses, by user id; a person who touched none has an empty list. */
export async function trainingOf(
  db: DbOrTx,
  userIds: readonly string[],
): Promise<ReadonlyMap<string, readonly CourseStanding[]>> {
  if (userIds.length === 0) return new Map();
  const [courses, rows] = await Promise.all([
    Promise.all(
      COURSE_IDS.map(async (courseId) => ({
        courseId,
        lessonIds: (await loadCourse(courseId)).modules.flatMap((m) => m.lessonIds),
      })),
    ),
    db
      .select({
        userId: trainingLessonProgress.userId,
        courseId: trainingLessonProgress.courseId,
        lessonId: trainingLessonProgress.lessonId,
        completed: trainingLessonProgress.completed,
        completedAt: trainingLessonProgress.completedAt,
        quizPassed: trainingLessonProgress.quizPassed,
        updatedAt: trainingLessonProgress.updatedAt,
      })
      .from(trainingLessonProgress)
      .where(inArray(trainingLessonProgress.userId, [...userIds])),
  ]);
  return new Map(
    userIds.map((userId) => [
      userId,
      courses.flatMap(({ courseId, lessonIds }): CourseStanding[] => {
        const mine = rows.filter((r) => r.userId === userId && r.courseId === courseId);
        if (mine.length === 0) return [];
        const done = courseCompletion(lessonIds, mine);
        return [
          {
            courseId,
            lessonsDone: done.completedInCourse,
            lessonsTotal: done.totalCount,
            quizzesPassed: mine.filter((r) => r.quizPassed).length,
            finished: done.allCompleted,
            // As the Graphs tab dates a finish: the last completion, else the last change.
            finishedAt: done.allCompleted
              ? latest(mine.map((r) => r.completedAt ?? r.updatedAt))
              : null,
            lastActivityAt: latest(mine.map((r) => r.updatedAt)),
          },
        ];
      }),
    ]),
  );
}

/** Every AI assistant the person connected, in any company, the newest first. */
export const assistantsOf = (db: DbOrTx, userId: string) =>
  db
    .select({
      kind: mcpConnection.kind,
      client: mcpConnection.client,
      companyName: company.name,
      connectedAt: mcpConnection.createdAt,
      lastUsedAt: mcpConnection.lastUsedAt,
      endedAt: mcpConnection.endedAt,
      expiresAt: mcpConnection.expiresAt,
    })
    .from(mcpConnection)
    .innerJoin(company, eq(company.id, mcpConnection.companyId))
    .where(eq(mcpConnection.userId, userId))
    .orderBy(desc(mcpConnection.createdAt));

/** How often the person did each thing the audit log records, the most frequent first. */
export const actionCountsOf = (db: DbOrTx, userId: string, limit: number) =>
  db
    .select({
      action: auditLog.action,
      count: count(),
      first: min(auditLog.createdAt),
      last: max(auditLog.createdAt),
    })
    .from(auditLog)
    .where(eq(auditLog.userId, userId))
    .groupBy(auditLog.action)
    .orderBy(desc(count()))
    .limit(limit);

/**
 * Actions that are work on the walkthrough and the requirements behind it, as the audit log names
 * them: the walkthrough's own procedures and state events, requirement sign-offs, answers and
 * evidence.
 */
export const WALK_ACTION_PREFIXES = [
  "durchgang.",
  "requirement.",
  "intake.",
  "evidence.",
  "review.",
] as const;

const startsWithAny = (prefixes: readonly string[]) =>
  or(...prefixes.map((p) => ilike(auditLog.action, `${p}%`)));

/** What one member of a company did in it. */
export interface MemberWork {
  readonly actions: number;
  readonly walkActions: number;
  readonly lastActionAt: Date | null;
  readonly signOffs: number;
}

/**
 * Per member of a company, what they did there: audit rows in that company, how many were
 * walkthrough work, the last one, and the requirements they signed. Keyed by user id.
 */
export async function membersWorkIn(
  db: DbOrTx,
  companyId: string,
  userIds: readonly string[],
): Promise<ReadonlyMap<string, MemberWork>> {
  if (userIds.length === 0) return new Map<string, MemberWork>();
  const [audit, signOffs] = await Promise.all([
    db
      .select({
        userId: auditLog.userId,
        actions: count(),
        walkActions: sql<number>`(count(*) filter (where ${startsWithAny(WALK_ACTION_PREFIXES)}))::int`,
        lastActionAt: max(auditLog.createdAt),
      })
      .from(auditLog)
      .where(
        and(eq(auditLog.companyId, companyId), inArray(auditLog.userId, [...userIds])),
      )
      .groupBy(auditLog.userId),
    db
      .select({ userId: signOffHistory.signedOffBy, signOffs: count() })
      .from(signOffHistory)
      .where(
        and(
          eq(signOffHistory.companyId, companyId),
          inArray(signOffHistory.signedOffBy, [...userIds]),
        ),
      )
      .groupBy(signOffHistory.signedOffBy),
  ]);
  return new Map(
    userIds.map((userId): [string, MemberWork] => {
      const a = audit.find((r) => r.userId === userId);
      return [
        userId,
        {
          actions: a?.actions ?? 0,
          walkActions: a?.walkActions ?? 0,
          lastActionAt: a?.lastActionAt ?? null,
          signOffs: signOffs.find((r) => r.userId === userId)?.signOffs ?? 0,
        },
      ];
    }),
  );
}

/** People whose email or name holds the text, any case; or the one person with that id. */
export function findPeople(db: DbOrTx, text: string, limit: number) {
  const pattern = `%${literal(text)}%`;
  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      companyId: company.id,
      companyName: company.name,
    })
    .from(user)
    .leftJoin(company, eq(company.id, user.companyId))
    .where(
      or(
        ilike(user.email, pattern),
        ilike(user.name, pattern),
        ilike(company.name, pattern),
        sql`${user.id}::text = ${text}`,
      ),
    )
    .orderBy(sql`${user.lastLoginAt} desc nulls last`)
    .limit(limit);
}
