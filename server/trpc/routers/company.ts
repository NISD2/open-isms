import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import type { DbOrTx } from "@/lib/db";
import { listUserCompanies, openCompany } from "@/lib/organization/membership";
import { billingAccount, company } from "@/schema";
import { insertDraftCompany } from "../helpers/setup-helpers";
import { activatedCompanyProcedure, protectedProcedure, router } from "../init";

/**
 * The account of a set-up company. Any member of it may add companies to that account, because one
 * payment covers unlimited companies; a draft cannot, so a half-finished signup does not multiply.
 */
const accountOfSetUpCompany = async (db: DbOrTx, companyId: string) => {
  const [row] = await db
    .select({ billingAccountId: company.billingAccountId })
    .from(company)
    .where(and(eq(company.id, companyId), isNotNull(company.activatedAt)))
    .limit(1);
  return row?.billingAccountId ?? null;
};

export const companyRouter = router({
  /** The companies the caller belongs to, for the company switcher. */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const companies = await listUserCompanies(ctx.db, ctx.userId);
    const canAddCompany = ctx.companyId
      ? (await accountOfSetUpCompany(ctx.db, ctx.companyId)) !== null
      : false;
    return {
      companies: companies.map(({ id, name, activatedAt, role }) => ({
        id,
        name,
        role,
        activated: activatedAt !== null,
        open: id === ctx.companyId,
      })),
      canAddCompany,
    };
  }),

  /** Open one of the caller's companies. A company they do not belong to is not found. */
  open: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const opened = await openCompany(ctx.db, {
        userId: ctx.userId,
        companyId: input.companyId,
      });
      if (!opened)
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found." });
      return { companyId: input.companyId };
    }),

  /**
   * Start another company under the paying account of the open one, so it inherits the account's
   * access level. Any member of a set-up company may add one; the caller owns the new company, and
   * the account keeps its owner, who pays. The new company is a draft, opened for the caller, and
   * set up through the same journey as a first one; a draft the caller already started under this
   * account is reopened instead of adding a second.
   */
  createAnother: activatedCompanyProcedure.mutation(async ({ ctx }) => {
    const billingAccountId = await accountOfSetUpCompany(ctx.db, ctx.companyId);
    if (!billingAccountId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Set up this company before adding another.",
      });
    }

    return ctx.db.transaction(async (tx) => {
      // Serialises concurrent adds on this account, so a double click cannot start two drafts.
      await tx
        .select({ id: billingAccount.id })
        .from(billingAccount)
        .where(eq(billingAccount.id, billingAccountId))
        .for("update");
      const [draft] = await tx
        .select({ id: company.id })
        .from(company)
        .where(
          and(
            eq(company.billingAccountId, billingAccountId),
            eq(company.ownerId, ctx.userId),
            isNull(company.activatedAt),
          ),
        )
        .limit(1);
      if (draft && (await openCompany(tx, { userId: ctx.userId, companyId: draft.id }))) {
        return { companyId: draft.id };
      }
      return insertDraftCompany(tx, { userId: ctx.userId, billingAccountId });
    });
  }),
});
