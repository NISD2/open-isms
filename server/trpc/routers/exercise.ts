import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow, updateRow } from "../typed";
import { exercise } from "@/schema";
import { exerciseInsertSchema, exerciseUpdateSchema } from "@/schema/validators";

export const exerciseRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.exercise.findMany({
      where: eq(exercise.companyId, ctx.companyId),
      orderBy: [desc(exercise.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(exerciseInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId };
      const [row] = await ctx.db
        .insert(exercise)
        .values(insertRow(exercise, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "exercise", ctx.userId).catch((err) => console.error("[background] exercise recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(exerciseUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(exercise)
        .set(updateRow(exercise, updates))
        .where(and(eq(exercise.id, id), eq(exercise.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "exercise", ctx.userId).catch((err) => console.error("[background] exercise recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(exercise)
        .where(and(eq(exercise.id, input.id), eq(exercise.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "exercise", ctx.userId).catch((err) => console.error("[background] exercise:", err));
      return { deleted: true };
    }),
});
