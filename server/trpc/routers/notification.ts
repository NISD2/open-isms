import { z } from "zod";
import { eq, and, count, isNull } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { notification } from "@/schema";

export const notificationRouter = router({
  list: companyProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      }).optional().default({ limit: 50, offset: 0 })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.notification.findMany({
        // in_app only: email-channel rows are delivery bookkeeping (digest
        // scheduling, course-followup dedup, lifecycle claims) and were never
        // written for the bell — surfacing them showed raw entityType strings
        // and, for a kept-after-failure lifecycle claim, an entry for an
        // email that never arrived.
        where: and(
          eq(notification.recipientId, ctx.userId),
          eq(notification.companyId, ctx.companyId),
          eq(notification.channel, "in_app"),
        ),
        orderBy: [desc(notification.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });
    }),

  countUnread: companyProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.recipientId, ctx.userId),
          eq(notification.companyId, ctx.companyId),
          eq(notification.channel, "in_app"),
          isNull(notification.acknowledgedAt),
        )
      );
    return result?.count ?? 0;
  }),

  acknowledge: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(notification)
        .set({ acknowledgedAt: new Date(), status: "acknowledged" })
        .where(
          and(
            eq(notification.id, input.id),
            eq(notification.recipientId, ctx.userId),
            eq(notification.companyId, ctx.companyId),
          )
        )
        .returning();
      return row;
    }),
});
