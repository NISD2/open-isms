import { and, eq } from "drizzle-orm";
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
import { activitiesOf, controllerOf } from "../helpers/processing-activity-record";
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
  /** The controller, its data protection officer and its security measures (Art. 30(1)(a), (g)). */
  controller: companyProcedure.query(({ ctx }) => controllerOf(ctx.db, ctx.companyId)),

  /** The activities, each with the suppliers receiving its data and their transfers. */
  list: companyProcedure.query(({ ctx }) => activitiesOf(ctx.db, ctx.companyId)),

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
