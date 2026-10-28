import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { asset, riskAsset } from "@/schema";
import { assetInsertSchema, assetUpdateSchema } from "@/schema/validators";
import { activatedCompanyProcedure, companyProcedure, router } from "../init";

/**
 * Answered only in the walk: how long a process may be down (4.2) and how long a system takes
 * back or that nobody knows (4.4). The walk's saves keep the last two apart as the column's
 * CHECK does; a plain update could not, so the form's router never takes them.
 */
const WALK_ONLY = {
  maxOutage: true,
  restoreTime: true,
  restoreTimeUnknown: true,
} as const;

export const assetRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.asset.findMany({
      where: eq(asset.companyId, ctx.companyId),
      orderBy: [asc(asset.name)],
    });
  }),

  create: activatedCompanyProcedure
    .input(
      assetInsertSchema.omit({
        id: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        ...WALK_ONLY,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(asset)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "asset", ctx.userId).catch((err) =>
        console.error("[background] asset recheck:", err),
      );
      return row;
    }),

  update: activatedCompanyProcedure
    .input(assetUpdateSchema.omit(WALK_ONLY).extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(asset)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(asset.id, id), eq(asset.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "asset", ctx.userId).catch((err) =>
        console.error("[background] asset recheck:", err),
      );
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
      recheckModuleRequirements(ctx.db, ctx.companyId, "asset", ctx.userId).catch((err) =>
        console.error("[background] asset:", err),
      );
      return { deleted: true };
    }),
});
