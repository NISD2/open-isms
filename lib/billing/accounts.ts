/**
 * Billing accounts: the paying customer above its companies.
 *
 * Every company belongs to exactly one account, and what a company may use is the account's access
 * level. A second company created by an existing customer joins that customer's account and so
 * inherits its level; only a first company gets a new account.
 */
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { type accessLevelEnum, billingAccount, company, invoice } from "@/schema";

export type AccessLevel = (typeof accessLevelEnum.enumValues)[number];

/**
 * The level a brand-new account gets. Grandfathered until the access gate ships, because
 * grandfathering stops when the paywall goes live, and everyone who gets in before that keeps the
 * current journey free. The change that ships the gate sets this to "free".
 */
export const NEW_ACCOUNT_ACCESS_LEVEL: AccessLevel = "grandfathered";

/** Open a new billing account and return its id. */
export const createBillingAccount = async (
  db: DbOrTx,
  ownerUserId: string | null,
): Promise<string> => {
  const [account] = await db
    .insert(billingAccount)
    .values({ ownerUserId, accessLevel: NEW_ACCOUNT_ACCESS_LEVEL })
    .returning({ id: billingAccount.id });
  if (!account) throw new Error("billing account insert returned no row");
  return account.id;
};

/**
 * Delete an account nothing uses any more: no company points at it and no invoice was ever issued
 * to it. Accounts with invoices are kept, because issued invoices must be kept.
 */
export const deleteBillingAccountIfUnused = async (
  db: DbOrTx,
  accountId: string,
): Promise<void> => {
  const inUse = await db.query.company.findFirst({
    where: eq(company.billingAccountId, accountId),
    columns: { id: true },
  });
  const invoiced = await db.query.invoice.findFirst({
    where: eq(invoice.billingAccountId, accountId),
    columns: { id: true },
  });
  if (inUse || invoiced) return;
  await db.delete(billingAccount).where(eq(billingAccount.id, accountId));
};
