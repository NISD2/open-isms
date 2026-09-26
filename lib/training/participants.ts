import "@/lib/server-guard";
import { countDistinct, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { trainingLessonProgress } from "@/schema";

/**
 * How many people have started each course: distinct users with any lesson row. A course has no
 * separate sign-up, so opening the first lesson is the sign-up. Only counts leave this function,
 * nothing about who the people are. A course nobody has started is absent from the result.
 */
export const courseParticipants = async (
  db: DbOrTx,
  courseIds: readonly string[],
): Promise<Readonly<Record<string, number>>> => {
  if (courseIds.length === 0) return {};
  const rows = await db
    .select({
      courseId: trainingLessonProgress.courseId,
      people: countDistinct(trainingLessonProgress.userId),
    })
    .from(trainingLessonProgress)
    .where(inArray(trainingLessonProgress.courseId, [...courseIds]))
    .groupBy(trainingLessonProgress.courseId);
  return Object.fromEntries(rows.map((row) => [row.courseId, row.people]));
};
