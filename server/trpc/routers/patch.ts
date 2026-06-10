import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow, updateRow } from "../typed";
import { patchRecord } from "@/schema";
import { patchRecordInsertSchema, patchRecordUpdateSchema } from "@/schema/validators";

export const patchRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.patchRecord.findMany({
      where: eq(patchRecord.companyId, ctx.companyId),
      orderBy: [desc(patchRecord.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(patchRecordInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId };
      const [row] = await ctx.db
        .insert(patchRecord)
        .values(insertRow(patchRecord, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "patch_record", ctx.userId).catch((err) => console.error("[background] patch_record recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(patchRecordUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(patchRecord)
        .set(updateRow(patchRecord, updates))
        .where(and(eq(patchRecord.id, id), eq(patchRecord.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "patch_record", ctx.userId).catch((err) => console.error("[background] patch_record recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(patchRecord)
        .where(and(eq(patchRecord.id, input.id), eq(patchRecord.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "patch_record", ctx.userId).catch((err) => console.error("[background] patch:", err));
      return { deleted: true };
    }),
});
