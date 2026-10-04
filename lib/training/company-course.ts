import "@/lib/server-guard";
import { and, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { listCompanyMembers } from "@/lib/organization/membership";
import { trainingLessonProgress } from "@/schema";
import type { CourseId } from "./catalog";
import { courseCompletion } from "./completion";
import { loadCourse } from "./course-loader";

/** A member who opened at least one lesson: finished by the certificate's rule, or on the way. */
export type CourseParticipant = {
  readonly userId: string;
  readonly name: string;
} & (
  | {
      readonly status: "finished";
      /** The day the last lesson was completed, or null when no completion carries a date. */
      readonly completedAt: Date | null;
    }
  | {
      readonly status: "started";
      /** Lessons completed among the course's current ones. */
      readonly done: number;
      readonly total: number;
    }
);

/**
 * The company's members who started or completed a course on the platform, completion by the
 * rule the certificate uses. Read from lesson progress every time rather than copied into the
 * training register, so a course finished later shows up without anyone entering it.
 */
export async function courseParticipants(
  db: DbOrTx,
  companyId: string,
  courseId: CourseId,
): Promise<{
  title: Readonly<Record<string, string>>;
  participants: CourseParticipant[];
}> {
  const [course, members] = await Promise.all([
    loadCourse(courseId),
    listCompanyMembers(db, companyId),
  ]);
  if (members.length === 0) return { title: course.title, participants: [] };
  const lessonIds = course.modules.flatMap((m) => m.lessonIds);
  const progress = await db
    .select({
      userId: trainingLessonProgress.userId,
      lessonId: trainingLessonProgress.lessonId,
      completed: trainingLessonProgress.completed,
      completedAt: trainingLessonProgress.completedAt,
    })
    .from(trainingLessonProgress)
    .where(
      and(
        eq(trainingLessonProgress.courseId, courseId),
        inArray(
          trainingLessonProgress.userId,
          members.map((m) => m.id),
        ),
      ),
    );
  const participants = members.flatMap((member): CourseParticipant[] => {
    const rows = progress.filter((p) => p.userId === member.id);
    if (rows.length === 0) return [];
    const name = member.name?.trim() || member.email;
    const done = courseCompletion(lessonIds, rows);
    return [
      done.allCompleted && done.completionDate
        ? {
            userId: member.id,
            name,
            status: "finished",
            completedAt: done.completionDate.getTime() === 0 ? null : done.completionDate,
          }
        : {
            userId: member.id,
            name,
            status: "started",
            done: done.completedInCourse,
            total: done.totalCount,
          },
    ];
  });
  return { title: course.title, participants };
}
