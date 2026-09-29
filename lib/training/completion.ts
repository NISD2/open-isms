/**
 * Whether a person has completed a course: every lesson of the course marked
 * completed, dated by the last lesson they finished. The one rule behind the
 * course certificate and the CRM's course fields, so the two cannot disagree.
 *
 * Only the course's current lessons count: progress on a lesson that was removed
 * from the course neither adds to the count nor completes it.
 */
export interface LessonProgressRow {
  readonly lessonId: string;
  readonly completed: boolean;
  readonly completedAt: Date | null;
}

export interface CourseCompletion {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly allCompleted: boolean;
  /** The last completion among the course's lessons; null until all are done or undated. */
  readonly completionDate: Date | null;
}

export const courseCompletion = (
  lessonIds: readonly string[],
  progress: readonly LessonProgressRow[],
): CourseCompletion => {
  const inCourse = new Set(lessonIds);
  const completed = progress.filter((p) => p.completed && inCourse.has(p.lessonId));
  const completedIds = new Set(completed.map((p) => p.lessonId));
  const allCompleted = completedIds.size === inCourse.size;
  const dates = completed.flatMap((p) =>
    p.completedAt ? [p.completedAt.getTime()] : [],
  );
  return {
    completedCount: completedIds.size,
    totalCount: lessonIds.length,
    allCompleted,
    completionDate:
      allCompleted && dates.length > 0 ? new Date(Math.max(...dates)) : null,
  };
};
