import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { courseCompletion } from "@/lib/training/completion";
import { loadCourse, loadLesson } from "@/lib/training/course-loader";
import { trainingLessonProgress, user } from "@/schema";
import { protectedProcedure, router } from "../init";

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

      const { completedCount, allCompleted, completionDate } = courseCompletion(
        allLessonIds,
        progress,
      );

      const courseModules: {
        title: Record<string, string>;
        lessons: { id: string; title: Record<string, string>; minutes: number }[];
      }[] = [];
      for (const mod of course.modules) {
        const lessons: { id: string; title: Record<string, string>; minutes: number }[] =
          [];
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
        completedCount,
        totalCount: allLessonIds.length,
        completionDate: completionDate?.toISOString() ?? null,
        totalMinutes,
        userName: userData?.name ?? null,
        userEmail: userData?.email ?? null,
        courseModules,
      };
    }),
});
