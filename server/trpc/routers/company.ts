import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, isNull, ne, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { createBillingAccount } from "@/lib/billing/accounts";
import type { DbOrTx } from "@/lib/db";
import { listUserCompanies, openCompany } from "@/lib/organization/membership";
import { billingAccount, company, user } from "@/schema";
import { insertDraftCompany } from "../helpers/setup-helpers";
import { adminProcedure, protectedProcedure, router } from "../init";

/**
 * The account of a set-up company, or null for a draft. Only from a set-up company may its admins
 * add another, so a half-finished signup does not multiply.
 */
const accountOfSetUpCompany = async (db: DbOrTx, companyId: string) => {
  const [row] = await db
    .select({ billingAccountId: company.billingAccountId })
    .from(company)
    .where(and(eq(company.id, companyId), isNotNull(company.activatedAt)))
    .limit(1);
  return row?.billingAccountId ?? null;
};

/** Whether this person pays for the account (`billing_account.owner_user_id`). */
const paysFor = async (db: DbOrTx, userId: string, accountId: string) => {
  const [row] = await db
    .select({ id: billingAccount.id })
    .from(billingAccount)
    .where(and(eq(billingAccount.id, accountId), eq(billingAccount.ownerUserId, userId)))
    .limit(1);
  return row !== undefined;
};

/** A draft this person started on this account, to reopen instead of adding a second. */
const draftOn = async (db: DbOrTx, userId: string, accountId: string) => {
  const [row] = await db
    .select({ id: company.id })
    .from(company)
    .where(
      and(
        eq(company.billingAccountId, accountId),
        eq(company.ownerId, userId),
        isNull(company.activatedAt),
      ),
    )
    .limit(1);
  return row?.id ?? null;
};

/**
 * A draft this person started on an account of its own, the one a new account brings: reopened
 * when they ask for a new account again, so a double click does not open two accounts.
 */
const draftAlone = async (db: DbOrTx, userId: string) => {
  const other = alias(company, "other");
  const [row] = await db
    .select({ id: company.id })
    .from(company)
    .innerJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(
      and(
        eq(company.ownerId, userId),
        isNull(company.activatedAt),
        eq(billingAccount.ownerUserId, userId),
        notExists(
          db
            .select({ id: other.id })
            .from(other)
            .where(
              and(
                eq(other.billingAccountId, billingAccount.id),
                ne(other.id, company.id),
              ),
            ),
        ),
      ),
    )
    .limit(1);
  return row?.id ?? null;
};

export const companyRouter = router({
  /** The companies the caller belongs to, for the company switcher. */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const companies = await listUserCompanies(ctx.db, ctx.userId);
    // The same tests as adminProcedure on createAnother and billingChoices (the role, and the
    // access gate that refuses a free account), so the menu only offers what succeeds.
    const canAddCompany =
      ctx.companyId && ctx.session.role === "admin" && ctx.session.accessLevel !== "free"
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
   * The billing accounts a new company can go under: the ones the caller pays for, each with its
   * companies, oldest first. `preselect` is the open company's account when the caller pays for
   * it, else their first paid one, else their first; null means they pay for none, so a new
   * account is the only choice.
   */
  billingChoices: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: billingAccount.id,
        accessLevel: billingAccount.accessLevel,
        companyId: company.id,
        companyName: company.name,
      })
      .from(billingAccount)
      .leftJoin(company, eq(company.billingAccountId, billingAccount.id))
      .where(eq(billingAccount.ownerUserId, ctx.userId))
      .orderBy(billingAccount.createdAt, company.createdAt);
    const accounts = [...new Set(rows.map((r) => r.id))].map((id) => {
      const own = rows.filter((r) => r.id === id);
      return {
        id,
        paid: own[0]?.accessLevel === "full",
        companies: own.flatMap((r) => (r.companyId ? [r.companyName ?? ""] : [])),
      };
    });
    const open = await accountOfSetUpCompany(ctx.db, ctx.companyId);
    return {
      accounts,
      preselect:
        accounts.find((a) => a.id === open)?.id ??
        accounts.find((a) => a.paid)?.id ??
        accounts[0]?.id ??
        null,
    };
  }),

  /**
   * Start another company under a billing account the caller pays for, so it inherits that
   * account's access level, or under a new account of its own (`billingAccountId: null`), which
   * starts unpaid. Only accounts the caller pays for are offered: adding a company to someone
   * else's account would spend their payment (Simon, 23.10.2026: "if it's paid only the payer ...
   * can change"). Only an admin of a set-up company may add one, so a half-finished signup does
   * not multiply. The new company is a draft, opened for the caller, and set up through the same
   * journey as a first one; a draft the caller already started there is reopened instead of adding
   * a second.
   */
  createAnother: adminProcedure
    .input(z.object({ billingAccountId: z.string().uuid().nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (!(await accountOfSetUpCompany(ctx.db, ctx.companyId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Set up this company before adding another.",
        });
      }

      return ctx.db.transaction(async (tx) => {
        // Serialises this person's adds, so a double click cannot start two drafts.
        await tx
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, ctx.userId))
          .for("no key update");
        const chosen = input.billingAccountId;
        if (chosen && !(await paysFor(tx, ctx.userId, chosen))) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not your billing account.",
          });
        }
        const draft = chosen
          ? await draftOn(tx, ctx.userId, chosen)
          : await draftAlone(tx, ctx.userId);
        if (draft && (await openCompany(tx, { userId: ctx.userId, companyId: draft }))) {
          return { companyId: draft };
        }
        const billingAccountId = chosen ?? (await createBillingAccount(tx, ctx.userId));
        return insertDraftCompany(tx, { userId: ctx.userId, billingAccountId });
      });
    }),
});
