import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow, updateRow } from "../typed";
import { changeRequest } from "@/schema";
import { changeRequestInsertSchema, changeRequestUpdateSchema } from "@/schema/validators";

export const changeRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.changeRequest.findMany({
      where: eq(changeRequest.companyId, ctx.companyId),
      orderBy: [desc(changeRequest.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(changeRequestInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId, requestedBy: ctx.userId };
      const [row] = await ctx.db
        .insert(changeRequest)
        .values(insertRow(changeRequest, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "change_request", ctx.userId).catch((err) => console.error("[background] change_request recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(changeRequestUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(changeRequest)
        .set(updateRow(changeRequest, updates))
        .where(and(eq(changeRequest.id, id), eq(changeRequest.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "change_request", ctx.userId).catch((err) => console.error("[background] change_request recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(changeRequest)
        .where(and(eq(changeRequest.id, input.id), eq(changeRequest.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "change_request", ctx.userId).catch((err) => console.error("[background] change:", err));
      return { deleted: true };
    }),
});
