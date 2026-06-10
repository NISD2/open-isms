import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { policy, policyAcknowledgment } from "@/schema";
import { policyInsertSchema, policyUpdateSchema } from "@/schema/validators";

export const policyRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.policy.findMany({
      where: eq(policy.companyId, ctx.companyId),
      orderBy: [desc(policy.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(policyInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(policy)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "policy", ctx.userId).catch((err) => console.error("[background] policy recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(policyUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(policy)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(policy.id, id), eq(policy.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "policy", ctx.userId).catch((err) => console.error("[background] policy recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(policy)
        .where(and(eq(policy.id, input.id), eq(policy.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "policy", ctx.userId).catch((err) => console.error("[background] policy:", err));
      return { deleted: true };
    }),

  acknowledge: companyProcedure
    .input(z.object({ policyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const parentPolicy = await ctx.db.query.policy.findFirst({
        where: and(eq(policy.id, input.policyId), eq(policy.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentPolicy) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await ctx.db
        .insert(policyAcknowledgment)
        .values({
          policyId: input.policyId,
          userId: ctx.userId,
          acknowledgedAt: new Date(),
        })
        .returning();
      return row;
    }),

  listAcknowledgments: companyProcedure
    .input(z.object({ policyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const parentPolicy = await ctx.db.query.policy.findFirst({
        where: and(eq(policy.id, input.policyId), eq(policy.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentPolicy) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.query.policyAcknowledgment.findMany({
        where: eq(policyAcknowledgment.policyId, input.policyId),
      });
    }),
});
