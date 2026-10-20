import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { processingActivity } from "@/schema";
import {
  processingActivityCreateSchema,
  processingActivityUpdateSchema,
} from "@/schema/processing-activity-validators";
import {
  activatedCompanyProcedure,
  adminProcedure,
  companyProcedure,
  router,
} from "../init";

const MODULE = "processing_activity";

/**
 * The record of processing activities (Art. 30(1) GDPR) as a register: the GDPR walk fills it
 * (durchgang.gdpr), the register page shows and edits it. Every query is the session's company's;
 * a change sends the requirements resting on the record back to management, as every register does.
 */
export const processingActivityRouter = router({
  list: companyProcedure.query(({ ctx }) =>
    ctx.db.query.processingActivity.findMany({
      where: eq(processingActivity.companyId, ctx.companyId),
      orderBy: [asc(processingActivity.createdAt), asc(processingActivity.name)],
    }),
  ),

  create: activatedCompanyProcedure
    .input(processingActivityCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(processingActivity)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, MODULE, ctx.userId).catch((err) =>
        console.error(`[background] ${MODULE} recheck:`, err),
      );
      return row;
    }),

  update: activatedCompanyProcedure
    .input(processingActivityUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(processingActivity)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(processingActivity.id, id),
            eq(processingActivity.companyId, ctx.companyId),
          ),
        )
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, MODULE, ctx.userId).catch((err) =>
        console.error(`[background] ${MODULE} recheck:`, err),
      );
      return row;
    }),

  /** Taking an activity off the record is an admin's act. */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(processingActivity)
        .where(
          and(
            eq(processingActivity.id, input.id),
            eq(processingActivity.companyId, ctx.companyId),
          ),
        );
      recheckModuleRequirements(ctx.db, ctx.companyId, MODULE, ctx.userId).catch((err) =>
        console.error(`[background] ${MODULE} recheck:`, err),
      );
      return { deleted: true };
    }),
});
