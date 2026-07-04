import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { router, companyProcedure, activatedCompanyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { asset, riskAsset } from "@/schema";
import { assetInsertSchema, assetUpdateSchema } from "@/schema/validators";

export const assetRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.asset.findMany({
      where: eq(asset.companyId, ctx.companyId),
      orderBy: [asc(asset.name)],
    });
  }),

  create: activatedCompanyProcedure
    .input(assetInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(asset)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "asset", ctx.userId).catch((err) => console.error("[background] asset recheck:", err));
      return row;
    }),

  update: activatedCompanyProcedure
    .input(assetUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(asset)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(asset.id, id), eq(asset.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "asset", ctx.userId).catch((err) => console.error("[background] asset recheck:", err));
      return row;
    }),

  delete: activatedCompanyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const owned = await ctx.db.query.asset.findFirst({
        where: and(eq(asset.id, input.id), eq(asset.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!owned) throw new Error("Asset not found");
      await ctx.db.delete(riskAsset).where(eq(riskAsset.assetId, input.id));
      await ctx.db
        .delete(asset)
        .where(and(eq(asset.id, input.id), eq(asset.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "asset", ctx.userId).catch((err) => console.error("[background] asset:", err));
      return { deleted: true };
    }),
});
