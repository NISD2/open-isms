/**
 * Whether a person has completed a course: every lesson of the course marked
 * completed. The one rule behind the course certificate and the CRM's course
 * fields, so the two cannot disagree about who finished.
 *
 * completedCount and completionDate keep the certificate's original arithmetic on
 * purpose: the date feeds certificateRef, printed on certificates people have
 * already shared, so a different date would change a reference already issued.
 * That means they include lessons since removed from the course, and the date is
 * the epoch when no completion carries one. completedInCourse is the progress
 * figure for anything new: the course's current lessons only.
 */
export interface LessonProgressRow {
  readonly lessonId: string;
  readonly completed: boolean;
  readonly completedAt: Date | null;
}

export interface CourseCompletion {
  /** Lessons marked completed, as the certificate has always counted them. */
  readonly completedCount: number;
  /** Completed lessons among the course's current ones. */
  readonly completedInCourse: number;
  readonly totalCount: number;
  readonly allCompleted: boolean;
  /** The latest completion, or the epoch when none is dated; null until complete. */
  readonly completionDate: Date | null;
}

export const courseCompletion = (
  lessonIds: readonly string[],
  progress: readonly LessonProgressRow[],
): CourseCompletion => {
  const completed = progress.filter((p) => p.completed);
  const completedIds = new Set(completed.map((p) => p.lessonId));
  const allCompleted = lessonIds.every((id) => completedIds.has(id));
  const completionDate = allCompleted
    ? completed.reduce(
        (latest, p) => (p.completedAt && p.completedAt > latest ? p.completedAt : latest),
        new Date(0),
      )
    : null;
  return {
    completedCount: completedIds.size,
    completedInCourse: lessonIds.filter((id) => completedIds.has(id)).length,
    totalCount: lessonIds.length,
    allCompleted,
    completionDate,
  };
};
