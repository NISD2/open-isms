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

      const courseModules: {
        title: Record<string, string>;
        lessons: { id: string; title: Record<string, string>; minutes: number }[];
      }[] = [];
      for (const mod of course.modules) {
        const lessons: { id: string; title: Record<string, string>; minutes: number }[] = [];
        for (const lessonId of mod.lessonIds) {
          const lesson = await loadLesson(input.courseId, lessonId);
          lessons.push({
            id: lessonId,
            title: lesson.title,
            minutes: lesson.estimatedMinutes,
          });
        }
        courseModules.push({ title: mod.title, lessons });
      }

      // Summed from the lessons rather than assumed at five minutes each. The
      // duration is the line a §38(3) auditor reads, and every lesson already
      // carries its own estimate, so guessing it was only ever going to drift.
      const totalMinutes = courseModules.reduce(
        (total, mod) => total + mod.lessons.reduce((n, l) => n + l.minutes, 0),
        0,
      );

      const [userData] = await ctx.db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, ctx.userId));

      return {
        courseTitle: course.title,
        certificate: course.certificate,
        allCompleted,
        completedCount: completedIds.size,
        totalCount: allLessonIds.length,
        completionDate: completionDate?.toISOString() ?? null,
        totalMinutes,
        userName: userData?.name ?? null,
        userEmail: userData?.email ?? null,
        courseModules,
      };
    }),
});
