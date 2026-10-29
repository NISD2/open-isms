import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { asset, processAsset, riskAsset } from "@/schema";
import { assetInsertSchema, assetUpdateSchema } from "@/schema/asset-validators";
import { ownedProcesses } from "../helpers/durchgang-gaps";
import { activatedCompanyProcedure, companyProcedure, router } from "../init";

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
    .input(assetUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // A process that stops being critical, or stops being a process, has no tolerance and
      // needs nothing: 4.2's answers go with the mark they belong to, here as in the walk.
      const stopsBeingCritical =
        data.isCritical === false || (data.type !== undefined && data.type !== "process");
      const [row] = await ctx.db
        .update(asset)
        .set({
          ...data,
          ...(stopsBeingCritical ? { maxOutage: null } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(asset.id, id), eq(asset.companyId, ctx.companyId)))
        .returning();
      // Only after the company-scoped update found the row, and through the company's own
      // processes, so the links touched are its own.
      if (row && stopsBeingCritical) {
        await ctx.db
          .delete(processAsset)
          .where(
            and(
              eq(processAsset.processId, id),
              inArray(processAsset.processId, ownedProcesses(ctx.db, ctx.companyId)),
            ),
          );
      }
      if (row && data.type === "process") {
        // A thing turned into a process is nobody's need any more.
        await ctx.db
          .delete(processAsset)
          .where(
            and(
              eq(processAsset.assetId, id),
              inArray(processAsset.processId, ownedProcesses(ctx.db, ctx.companyId)),
            ),
          );
      }
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
