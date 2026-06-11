import { z } from "zod";
import { eq, desc, isNull, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { router, protectedProcedure, publicProcedure } from "../init";
import { gapAssessment } from "@/schema";
import { getGapAssessmentData, answerMapSchema } from "@/lib/gap-assessment";
import { computeScores } from "@/lib/gap-assessment/scoring";
import { rateLimit } from "@/lib/rate-limit";

export const gapAssessmentRouter = router({
  /** Return all questions + domains from static JSON */
  getQuestions: protectedProcedure.query(() => {
    return getGapAssessmentData();
  }),

  /** Find the user's most recent in-progress assessment */
  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const conditions = [
      eq(gapAssessment.userId, ctx.userId),
      isNull(gapAssessment.completedAt),
    ];
    if (ctx.companyId) {
      conditions.push(eq(gapAssessment.companyId, ctx.companyId));
    }

    return ctx.db.query.gapAssessment.findFirst({
      where: and(...conditions),
      orderBy: [desc(gapAssessment.createdAt)],
    }) ?? null;
  }),

  /** Start a new assessment (idempotent — returns existing if in-progress) */
  startSession: protectedProcedure.mutation(async ({ ctx }) => {
    const conditions = [
      eq(gapAssessment.userId, ctx.userId),
      isNull(gapAssessment.completedAt),
    ];
    if (ctx.companyId) {
      conditions.push(eq(gapAssessment.companyId, ctx.companyId));
    }

    const existing = await ctx.db.query.gapAssessment.findFirst({
      where: and(...conditions),
      orderBy: [desc(gapAssessment.createdAt)],
    });

    if (existing) return existing;

    const [session] = await ctx.db
      .insert(gapAssessment)
      .values({
        userId: ctx.userId,
        companyId: ctx.companyId ?? null,
        answers: {},
      })
      .returning();

    return session;
  }),

  /** Save a single answer (upsert into answers JSONB) */
  saveAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        questionId: z.string(),
        answer: z.number().int().min(-1).max(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.query.gapAssessment.findFirst({
        where: and(
          eq(gapAssessment.id, input.sessionId),
          eq(gapAssessment.userId, ctx.userId),
        ),
      });

      if (!session) throw new Error("Session not found");
      if (session.completedAt) throw new Error("Session already completed");

      const answers = { ...(session.answers as Record<string, number>), [input.questionId]: input.answer };

      await ctx.db
        .update(gapAssessment)
        .set({ answers, updatedAt: new Date() })
        .where(eq(gapAssessment.id, input.sessionId));

      return { success: true };
    }),

  /** Save a batch of answers at once */
  saveBatchAnswers: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            answer: z.number().int().min(-1).max(2),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.query.gapAssessment.findFirst({
        where: and(
          eq(gapAssessment.id, input.sessionId),
          eq(gapAssessment.userId, ctx.userId),
        ),
      });

      if (!session) throw new Error("Session not found");
      if (session.completedAt) throw new Error("Session already completed");

      const answers = { ...(session.answers as Record<string, number>) };
      for (const a of input.answers) {
        answers[a.questionId] = a.answer;
      }

      await ctx.db
        .update(gapAssessment)
        .set({ answers, updatedAt: new Date() })
        .where(eq(gapAssessment.id, input.sessionId));

      return { success: true };
    }),

  /** Complete an assessment — compute and cache scores */
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.query.gapAssessment.findFirst({
        where: and(
          eq(gapAssessment.id, input.sessionId),
          eq(gapAssessment.userId, ctx.userId),
        ),
      });

      if (!session) throw new Error("Session not found");
      if (session.completedAt) throw new Error("Session already completed");

      const data = getGapAssessmentData();
      const answers = answerMapSchema.parse(session.answers);
      const scores = computeScores(data.questions, answers);

      const [updated] = await ctx.db
        .update(gapAssessment)
        .set({
          scores,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(gapAssessment.id, input.sessionId))
        .returning();

      return updated;
    }),

  /** Get results for a specific or most recent completed session */
  getResults: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const sessionId = input?.sessionId;

      if (sessionId) {
        const session = await ctx.db.query.gapAssessment.findFirst({
          where: and(
            eq(gapAssessment.id, sessionId),
            eq(gapAssessment.userId, ctx.userId),
          ),
        });
        return session ?? null;
      }

      return ctx.db.query.gapAssessment.findFirst({
        where: and(
          eq(gapAssessment.userId, ctx.userId),
          // Find the most recent completed one
        ),
        orderBy: [desc(gapAssessment.completedAt)],
      }) ?? null;
    }),

  /** List all sessions for the user (history) */
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.gapAssessment.findMany({
      where: eq(gapAssessment.userId, ctx.userId),
      orderBy: [desc(gapAssessment.createdAt)],
      columns: {
        id: true,
        createdAt: true,
        completedAt: true,
        scores: true,
      },
    });
  }),

  getSharedByToken: publicProcedure
    .input(
      z.object({
        token: z.string().uuid(),
        password: z.string().min(1).max(64),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!rateLimit(`gap-share:${input.token}`, 5, 15 * 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please wait 15 minutes and try again.",
        });
      }

      const row = await ctx.db.query.gapAssessment.findFirst({
        where: eq(gapAssessment.shareToken, input.token),
        columns: {
          scores: true,
          completedAt: true,
          sharePasswordHash: true,
          sharedAt: true,
        },
      });
      if (!row || !row.sharePasswordHash || !row.sharedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const valid = await bcrypt.compare(input.password, row.sharePasswordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return { scores: row.scores, completedAt: row.completedAt };
    }),
});
