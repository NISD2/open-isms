import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { dpoOf, GDPR_WALK, throughSupplier } from "@/lib/durchgang";
import {
  company,
  processingActivity,
  processingActivitySupplier,
  supplier,
} from "@/schema";
import {
  processingActivityCreateSchema,
  processingActivityUpdateSchema,
} from "@/schema/processing-activity-validators";
import { walkPolicyRows } from "../helpers/durchgang";
import { answersOf, DPO_ITEM } from "../helpers/durchgang-policy";
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
  /**
   * What the record states beside its activities: the controller and its contact details
   * (Art. 30(1)(a)), the data protection officer as G-DPO.1 recorded it, and the description of
   * the security measures (30(1)(g)) as G-TOM.1 wrote it, with whether management approved it.
   */
  controller: companyProcedure.query(async ({ ctx }) => {
    const [org, dpo, documents] = await Promise.all([
      ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: {
          name: true,
          legalName: true,
          registeredAddress: true,
          contactEmail: true,
          contactPhone: true,
        },
      }),
      answersOf(ctx.db, ctx.companyId, DPO_ITEM),
      walkPolicyRows(ctx.db, ctx.companyId, GDPR_WALK),
    ]);
    const measures = documents.find((d) => d.type === "gdpr_security_measures");
    return {
      name: org?.legalName || org?.name || null,
      address: org?.registeredAddress ?? null,
      email: org?.contactEmail ?? null,
      phone: org?.contactPhone ?? null,
      dpo: dpoOf(dpo),
      measures: measures
        ? { title: measures.title, approvedAt: measures.approvedAt }
        : null,
    };
  }),

  /**
   * The activities, each with the suppliers that receive its data and what each one's row says of
   * transfers outside the EEA (Art. 30(1)(d), (e)), so the record states them without asking twice.
   */
  list: companyProcedure.query(async ({ ctx }) => {
    const [activities, links] = await Promise.all([
      ctx.db.query.processingActivity.findMany({
        where: eq(processingActivity.companyId, ctx.companyId),
        orderBy: [asc(processingActivity.createdAt), asc(processingActivity.name)],
      }),
      ctx.db
        .select({
          activityId: processingActivitySupplier.activityId,
          id: supplier.id,
          name: supplier.name,
          internationalTransfer: supplier.internationalTransfer,
          transferMechanism: supplier.transferMechanism,
          transferCountries: supplier.transferCountries,
          transferCheckedAt: supplier.transferCheckedAt,
        })
        .from(processingActivitySupplier)
        .innerJoin(
          processingActivity,
          eq(processingActivity.id, processingActivitySupplier.activityId),
        )
        .innerJoin(supplier, eq(supplier.id, processingActivitySupplier.supplierId))
        .where(
          and(
            eq(processingActivity.companyId, ctx.companyId),
            eq(supplier.customerCompanyId, ctx.companyId),
          ),
        )
        .orderBy(asc(supplier.name)),
    ]);
    return activities.map((activity) => ({
      ...activity,
      suppliers: links
        .filter((l) => l.activityId === activity.id)
        .map((l) => ({ id: l.id, name: l.name, through: throughSupplier(l) })),
    }));
  }),

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
