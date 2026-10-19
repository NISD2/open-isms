import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { companyUploadPrefixes } from "@/lib/storage/object-key";
import { policy, policyAcknowledgment, policyVersion } from "@/schema";
import { policyInsertSchema, policyUpdateSchema } from "@/schema/validators";
import { assertOwnObjectKey } from "../guards";
import { approvalLapses, WITHDRAWN_APPROVAL } from "../helpers/policy-approval";
import { companyProcedure, router } from "../init";

/**
 * The only keys a policy's file may have. No upload path issues policy files yet; one added later
 * must put them here. Until then this keeps a stored key inside the company's own folder, so a
 * download built on the column cannot be pointed at another company's object.
 */
const policyFilePrefix = companyUploadPrefixes.policyFiles;

/**
 * Status, version and start of validity come from management's approval (approvePolicies), never
 * from a form: a status typed as "approved" would claim an approval nobody gave.
 */
const SET_BY_APPROVAL = { status: true, version: true, effectiveFrom: true } as const;

export const policyRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.policy.findMany({
      where: eq(policy.companyId, ctx.companyId),
      orderBy: [desc(policy.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(
      policyInsertSchema.omit({
        id: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        approvedBy: true,
        approvedAt: true,
        approverRole: true,
        ...SET_BY_APPROVAL,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertOwnObjectKey(policyFilePrefix(ctx.companyId), input.fileKey);
      const [row] = await ctx.db
        .insert(policy)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "policy", ctx.userId).catch((err) =>
        console.error("[background] policy recheck:", err),
      );
      return row;
    }),

  update: companyProcedure
    .input(policyUpdateSchema.omit(SET_BY_APPROVAL).extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      assertOwnObjectKey(policyFilePrefix(ctx.companyId), data.fileKey);
      const stored = await ctx.db.query.policy.findFirst({
        where: and(eq(policy.id, id), eq(policy.companyId, ctx.companyId)),
        columns: { title: true, content: true, fileKey: true, status: true },
      });
      if (!stored) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await ctx.db
        .update(policy)
        .set({
          ...data,
          ...(approvalLapses(stored, data) ? WITHDRAWN_APPROVAL : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(policy.id, id), eq(policy.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "policy", ctx.userId).catch((err) =>
        console.error("[background] policy recheck:", err),
      );
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(policy)
        .where(and(eq(policy.id, input.id), eq(policy.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "policy", ctx.userId).catch(
        (err) => console.error("[background] policy:", err),
      );
      return { deleted: true };
    }),

  /** What management approved for this policy, newest first: the record an edit cannot change. */
  versions: companyProcedure
    .input(z.object({ policyId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.db
        .select({
          id: policyVersion.id,
          title: policyVersion.title,
          content: policyVersion.content,
          contentSha256: policyVersion.contentSha256,
          approverRole: policyVersion.approverRole,
          approvedOn: policyVersion.approvedOn,
        })
        .from(policyVersion)
        .where(
          and(
            eq(policyVersion.policyId, input.policyId),
            eq(policyVersion.companyId, ctx.companyId),
          ),
        )
        .orderBy(desc(policyVersion.approvedAt)),
    ),

  acknowledge: companyProcedure
    .input(z.object({ policyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const parentPolicy = await ctx.db.query.policy.findFirst({
        where: and(eq(policy.id, input.policyId), eq(policy.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentPolicy) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await ctx.db
        .insert(policyAcknowledgment)
        .values({
          policyId: input.policyId,
          userId: ctx.userId,
          acknowledgedAt: new Date(),
        })
        .returning();
      return row;
    }),

  listAcknowledgments: companyProcedure
    .input(z.object({ policyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const parentPolicy = await ctx.db.query.policy.findFirst({
        where: and(eq(policy.id, input.policyId), eq(policy.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentPolicy) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.query.policyAcknowledgment.findMany({
        where: eq(policyAcknowledgment.policyId, input.policyId),
      });
    }),
});
