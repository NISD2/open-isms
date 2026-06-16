import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { trainingLessonProgress, user } from "@/schema";
import { loadCourse, loadLesson } from "@/lib/training/course-loader";

export const trainingCertificateRouter = router({
  getCourseCompletion: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await loadCourse(input.courseId);
      const allLessonIds = course.modules.flatMap((m) => m.lessonIds);

      const progress = await ctx.db
        .select()
        .from(trainingLessonProgress)
        .where(
          and(
            eq(trainingLessonProgress.userId, ctx.userId),
            eq(trainingLessonProgress.courseId, input.courseId),
          ),
        );

      const completedIds = new Set(
        progress.filter((p) => p.completed).map((p) => p.lessonId),
      );

      const allCompleted = allLessonIds.every((id) => completedIds.has(id));

      const completionDate = allCompleted
        ? progress
            .filter((p) => p.completed && p.completedAt)
            .reduce(
              (latest, p) =>
                p.completedAt && p.completedAt > latest ? p.completedAt : latest,
              new Date(0),
            )
        : null;

      const lessonTitles: { id: string; title: Record<string, string>; module: string }[] = [];
      for (const mod of course.modules) {
        for (const lessonId of mod.lessonIds) {
          const lesson = await loadLesson(input.courseId, lessonId);
          lessonTitles.push({
            id: lessonId,
            title: lesson.title,
            module: mod.title.en ?? mod.id,
          });
        }
      }

      const [userData] = await ctx.db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, ctx.userId));

      return {
        courseTitle: course.title,
        allCompleted,
        completedCount: completedIds.size,
        totalCount: allLessonIds.length,
        completionDate: completionDate?.toISOString() ?? null,
        userName: userData?.name ?? null,
        lessonTitles,
      };
    }),
});
