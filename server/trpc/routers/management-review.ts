import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { managementReview } from "@/schema";
import { managementReviewInsertSchema, managementReviewUpdateSchema } from "@/schema/validators";

export const managementReviewRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.managementReview.findMany({
      where: eq(managementReview.companyId, ctx.companyId),
      orderBy: [desc(managementReview.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(managementReviewInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(managementReview)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "management_review", ctx.userId).catch((err) => console.error("[background] management_review recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(managementReviewUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(managementReview)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(managementReview.id, id), eq(managementReview.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "management_review", ctx.userId).catch((err) => console.error("[background] management_review recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(managementReview)
        .where(and(eq(managementReview.id, input.id), eq(managementReview.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "management_review", ctx.userId).catch((err) => console.error("[background] management-review:", err));
      return { deleted: true };
    }),
});
