import "@/lib/server-guard";
import { and, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { listCompanyMembers } from "@/lib/organization/membership";
import { trainingLessonProgress } from "@/schema";
import type { CourseId } from "./catalog";
import { courseCompletion } from "./completion";
import { loadCourse } from "./course-loader";

export interface CourseGraduate {
  readonly userId: string;
  readonly name: string;
  /** The day the last lesson was completed, or null when no completion carries a date. */
  readonly completedAt: Date | null;
}

/**
 * The company's members who completed a course on the platform, by the rule the certificate
 * uses. Read from lesson progress every time rather than copied into the training register, so
 * a course finished later shows up without anyone entering it.
 */
export async function courseGraduates(
  db: DbOrTx,
  companyId: string,
  courseId: CourseId,
): Promise<{ title: Readonly<Record<string, string>>; graduates: CourseGraduate[] }> {
  const [course, members] = await Promise.all([
    loadCourse(courseId),
    listCompanyMembers(db, companyId),
  ]);
  if (members.length === 0) return { title: course.title, graduates: [] };
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
  const graduates = members.flatMap((member) => {
    const done = courseCompletion(
      lessonIds,
      progress.filter((p) => p.userId === member.id),
    );
    if (!done.allCompleted || !done.completionDate) return [];
    return [
      {
        userId: member.id,
        name: member.name?.trim() || member.email,
        completedAt: done.completionDate.getTime() === 0 ? null : done.completionDate,
      },
    ];
  });
  return { title: course.title, graduates };
}
