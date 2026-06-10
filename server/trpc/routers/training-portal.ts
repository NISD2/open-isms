import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { trainingLessonProgress } from "@/schema";
import {
  loadCourse,
  loadLesson,
  loadQuiz,
  loadDictionary,
  loadLessonContent,
} from "@/lib/training/course-loader";
import { renderLesson } from "@/lib/training/render-lesson";
import { shuffleIndices, quizSeed } from "@/lib/training/quiz-shuffle";

/** Progress queries filter by userId only - companyId is metadata, not a filter. */
function progressWhere(userId: string, courseId: string, lessonId?: string) {
  const conditions = [
    eq(trainingLessonProgress.userId, userId),
    eq(trainingLessonProgress.courseId, courseId),
  ];
  if (lessonId) conditions.push(eq(trainingLessonProgress.lessonId, lessonId));
  return and(...conditions);
}

export const trainingPortalRouter = router({
  getCourse: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await loadCourse(input.courseId);
      const progress = await ctx.db
        .select()
        .from(trainingLessonProgress)
        .where(progressWhere(ctx.userId, input.courseId));

      const allLessonIds = course.modules.flatMap((m) => m.lessonIds);
      const lessonMetas: Record<string, { title: Record<string, string>; estimatedMinutes: number; hasQuiz: boolean }> = {};
      await Promise.all(
        allLessonIds.map(async (id) => {
          const lesson = await loadLesson(input.courseId, id);
          lessonMetas[id] = {
            title: lesson.title,
            estimatedMinutes: lesson.estimatedMinutes,
            hasQuiz: lesson.hasQuiz,
          };
        }),
      );

      return { course, progress, lessonMetas };
    }),

  getLesson: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        lessonId: z.string(),
        locale: z.string().default("en"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [lesson, dictionary, markdown] = await Promise.all([
        loadLesson(input.courseId, input.lessonId),
        loadDictionary(input.courseId),
        loadLessonContent(input.courseId, input.lessonId, input.locale),
      ]);

      const { html, termsUsed } = await renderLesson(
        markdown,
        dictionary,
        input.locale,
      );

      const sidebarTerms = termsUsed.map((t) => ({
        term: t.term,
        type: t.type,
        definition: t.definition[input.locale] ?? t.definition.en,
      }));

      const [progress] = await ctx.db
        .select()
        .from(trainingLessonProgress)
        .where(progressWhere(ctx.userId, input.courseId, input.lessonId));

      // Auto-enrol on first visit so signups who never finish a lesson
      // still count towards the public learner counter on the landing page.
      if (!progress) {
        await ctx.db
          .insert(trainingLessonProgress)
          .values({
            userId: ctx.userId,
            companyId: ctx.companyId,
            courseId: input.courseId,
            lessonId: input.lessonId,
            completed: false,
          })
          .onConflictDoNothing();
      }

      return { lesson, html, sidebarTerms, progress: progress ?? null };
    }),

  getQuiz: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        lessonId: z.string(),
        locale: z.string().default("en"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const quiz = await loadQuiz(input.courseId, input.lessonId);
      if (!quiz) return null;

      const questions = quiz.questions.map((q) => {
        const permutation = shuffleIndices(
          q.options.length,
          quizSeed(ctx.userId, quiz.lessonId, q.id),
        );
        return {
          id: q.id,
          question: q.question[input.locale] ?? q.question.en,
          options: permutation.map(
            (origIdx) => q.options[origIdx][input.locale] ?? q.options[origIdx].en,
          ),
        };
      });

      return { lessonId: quiz.lessonId, passingScore: quiz.passingScore, questions };
    }),

  submitQuiz: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        lessonId: z.string(),
        locale: z.string().default("en"),
        answers: z.array(z.number().int().nonnegative()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quiz = await loadQuiz(input.courseId, input.lessonId);
      if (!quiz) throw new Error("No quiz for this lesson");

      if (input.answers.length !== quiz.questions.length) {
        throw new Error(
          `Expected ${quiz.questions.length} answers, got ${input.answers.length}`,
        );
      }

      let correct = 0;
      const corrections = quiz.questions.map((q, i) => {
        const shuffledSelected = input.answers[i];
        if (shuffledSelected === undefined) {
          throw new Error(`Missing answer for question ${i}`);
        }
        const permutation = shuffleIndices(
          q.options.length,
          quizSeed(ctx.userId, quiz.lessonId, q.id),
        );
        const originalSelected = permutation[shuffledSelected];
        if (originalSelected === undefined) {
          throw new Error(`Answer index ${shuffledSelected} out of range for question ${i}`);
        }
        const isCorrect = originalSelected === q.correctIndex;
        if (isCorrect) correct++;
        const shuffledCorrectIndex = permutation.indexOf(q.correctIndex);
        return {
          questionId: q.id,
          selectedIndex: shuffledSelected,
          correctIndex: shuffledCorrectIndex,
          isCorrect,
          explanation:
            q.explanation?.[input.locale] ?? q.explanation?.en ?? null,
        };
      });

      const score = Math.round((correct / quiz.questions.length) * 100);
      const passed = score >= quiz.passingScore;

      const existing = await ctx.db
        .select()
        .from(trainingLessonProgress)
        .where(progressWhere(ctx.userId, input.courseId, input.lessonId));

      const existingRow = existing[0];
      if (existingRow) {
        await ctx.db
          .update(trainingLessonProgress)
          .set({
            quizScore: score,
            quizPassed: passed,
            completed: passed,
            completedAt: passed ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(trainingLessonProgress.id, existingRow.id));
      } else {
        await ctx.db.insert(trainingLessonProgress).values({
          userId: ctx.userId,
          companyId: ctx.companyId,
          courseId: input.courseId,
          lessonId: input.lessonId,
          quizScore: score,
          quizPassed: passed,
          completed: passed,
          completedAt: passed ? new Date() : null,
        });
      }

      return { score, passed, corrections };
    }),

  completeLesson: protectedProcedure
    .input(z.object({ courseId: z.string(), lessonId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(trainingLessonProgress)
        .where(progressWhere(ctx.userId, input.courseId, input.lessonId));

      const existingRow = existing[0];
      if (existingRow) {
        await ctx.db
          .update(trainingLessonProgress)
          .set({ completed: true, completedAt: new Date(), updatedAt: new Date() })
          .where(eq(trainingLessonProgress.id, existingRow.id));
      } else {
        await ctx.db.insert(trainingLessonProgress).values({
          userId: ctx.userId,
          companyId: ctx.companyId,
          courseId: input.courseId,
          lessonId: input.lessonId,
          completed: true,
          completedAt: new Date(),
        });
      }

      return { success: true };
    }),

  getProgress: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(trainingLessonProgress)
        .where(progressWhere(ctx.userId, input.courseId));
    }),
});
