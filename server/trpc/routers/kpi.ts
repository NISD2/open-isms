import { eq, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow } from "../typed";
import { kpiMeasurement } from "@/schema";
import { kpiMeasurementInsertSchema } from "@/schema/validators";

export const kpiRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.kpiMeasurement.findMany({
      where: eq(kpiMeasurement.companyId, ctx.companyId),
      orderBy: [desc(kpiMeasurement.measuredAt)],
    });
  }),

  create: companyProcedure
    .input(kpiMeasurementInsertSchema.omit({ id: true, companyId: true, createdAt: true }))
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId };
      const [row] = await ctx.db
        .insert(kpiMeasurement)
        .values(insertRow(kpiMeasurement, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "kpi_measurement", ctx.userId).catch((err) => console.error("[background] kpi_measurement recheck:", err));
      return row;
    }),
});
