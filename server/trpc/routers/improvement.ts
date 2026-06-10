import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow, updateRow } from "../typed";
import { improvementItem } from "@/schema";
import { improvementItemInsertSchema, improvementItemUpdateSchema } from "@/schema/validators";

export const improvementRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.improvementItem.findMany({
      where: eq(improvementItem.companyId, ctx.companyId),
      orderBy: [desc(improvementItem.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(improvementItemInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId };
      const [row] = await ctx.db
        .insert(improvementItem)
        .values(insertRow(improvementItem, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "improvement_item", ctx.userId).catch((err) => console.error("[background] improvement_item recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(improvementItemUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(improvementItem)
        .set(updateRow(improvementItem, updates))
        .where(and(eq(improvementItem.id, id), eq(improvementItem.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "improvement_item", ctx.userId).catch((err) => console.error("[background] improvement_item recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(improvementItem)
        .where(and(eq(improvementItem.id, input.id), eq(improvementItem.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "improvement_item", ctx.userId).catch((err) => console.error("[background] improvement:", err));
      return { deleted: true };
    }),
});
