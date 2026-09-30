import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { daysUntilDeadline } from "@/lib/compliance/deadlines";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { bsiIncidentReport, incident } from "@/schema";
import { incidentInsertSchema, incidentUpdateSchema } from "@/schema/validators";
import { activatedCompanyProcedure, companyProcedure, router } from "../init";
import { insertRow, updateRow } from "../typed";

export const incidentRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.incident.findMany({
      where: eq(incident.companyId, ctx.companyId),
      orderBy: [desc(incident.updatedAt)],
    });
  }),

  create: activatedCompanyProcedure
    .input(
      incidentInsertSchema.omit({
        id: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId, createdBy: ctx.userId };
      const [row] = await ctx.db
        .insert(incident)
        .values(insertRow(incident, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "incident", ctx.userId).catch(
        (err) => console.error("[background] incident recheck:", err),
      );
      return row;
    }),

  update: activatedCompanyProcedure
    .input(incidentUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(incident)
        .set(updateRow(incident, updates))
        .where(and(eq(incident.id, id), eq(incident.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "incident", ctx.userId).catch(
        (err) => console.error("[background] incident recheck:", err),
      );
      return row;
    }),

  delete: activatedCompanyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(incident)
        .where(and(eq(incident.id, input.id), eq(incident.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "incident", ctx.userId).catch(
        (err) => console.error("[background] incident:", err),
      );
      return { deleted: true };
    }),

  bsiDeadlines: companyProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: bsiIncidentReport.id,
        reportType: bsiIncidentReport.reportType,
        dueAt: bsiIncidentReport.dueAt,
        incidentTitle: incident.title,
      })
      .from(bsiIncidentReport)
      .innerJoin(incident, eq(bsiIncidentReport.incidentId, incident.id))
      .where(
        and(eq(incident.companyId, ctx.companyId), isNull(bsiIncidentReport.submittedAt)),
      )
      .orderBy(bsiIncidentReport.dueAt);

    return rows.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      incidentTitle: r.incidentTitle,
      daysRemaining: daysUntilDeadline(r.dueAt),
    }));
  }),
});
