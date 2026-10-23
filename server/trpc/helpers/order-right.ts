/**
 * Who may order for the open company's billing account, read from the database for
 * `orderRightFor` (lib/billing/access.ts), and what the billing pages say about the account's
 * payer and organizations.
 */
import { and, eq, isNull } from "drizzle-orm";
import { type OrderRight, orderRightFor } from "@/lib/billing/access";
import { hasInvoice } from "@/lib/billing/account-invoices";
import type { AccessLevel } from "@/lib/billing/accounts";
import type { DbOrTx } from "@/lib/db";
import { company, companyMembership, user } from "@/schema";
import { acceptedInviteOf } from "./company-invite";

interface Account {
  readonly id: string;
  readonly accessLevel: AccessLevel;
  readonly ownerUserId: string | null;
}

/** Whether the person is an admin of every organization on the account: none lacks it. */
const adminOfEvery = async (db: DbOrTx, userId: string, accountId: string) => {
  const [lacking] = await db
    .select({ id: company.id })
    .from(company)
    .leftJoin(
      companyMembership,
      and(
        eq(companyMembership.companyId, company.id),
        eq(companyMembership.userId, userId),
        eq(companyMembership.role, "admin"),
      ),
    )
    .where(and(eq(company.billingAccountId, accountId), isNull(companyMembership.userId)))
    .limit(1);
  return lacking === undefined;
};

/** What `orderRightFor` decides from, read for the open company's account. */
export const orderFactsHere = async (
  db: DbOrTx,
  ctx: { readonly companyId: string; readonly userId: string },
  account: Account,
) => ({
  invoiced: await hasInvoice(db, account.id),
  adminOfAccount: await adminOfEvery(db, ctx.userId, account.id),
  invite:
    account.ownerUserId === ctx.userId
      ? null
      : await acceptedInviteOf(db, { companyId: ctx.companyId, userId: ctx.userId }),
});

/** Whether the caller may order for the open company's account. */
export const orderRightHere = (
  ctx: { readonly userId: string; readonly jobTitle: string | null },
  account: Account,
  facts: Awaited<ReturnType<typeof orderFactsHere>>,
): OrderRight =>
  orderRightFor({
    userId: ctx.userId,
    holderUserId: account.ownerUserId,
    adminOfAccount: facts.adminOfAccount,
    jobTitle: ctx.jobTitle,
    invite: facts.invite,
    unpaid: account.accessLevel !== "full" && !facts.invoiced,
  });

export const payerNameOf = async (
  db: DbOrTx,
  userId: string | null,
): Promise<string | null> => {
  if (!userId) return null;
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { name: true },
  });
  return row?.name?.trim() || null;
};

/** The names of the organizations on one account, oldest first. */
export const companiesOf = (db: DbOrTx, accountId: string) =>
  db
    .select({ id: company.id, name: company.name })
    .from(company)
    .where(eq(company.billingAccountId, accountId))
    .orderBy(company.createdAt);
