/**
 * Billing accounts: the paying customer above its companies.
 *
 * Every company belongs to exactly one account, and what a company may use is the account's access
 * level. A second company created by an existing customer joins that customer's account and so
 * inherits its level; only a first company gets a new account.
 */
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { isFeatureOn } from "@/lib/feature-flags";
import {
  type accessLevelEnum,
  billingAccount,
  company,
  invoice,
  orderCheck,
  user,
} from "@/schema";
import { newAccountAccessLevel } from "./access";

export type AccessLevel = (typeof accessLevelEnum.enumValues)[number];

/**
 * Open a new billing account and return its id. It starts grandfathered until billing is launched,
 * and after that free unless its owner was grandfathered at the launch (./access).
 */
export const createBillingAccount = async (
  db: DbOrTx,
  ownerUserId: string | null,
): Promise<string> => {
  const owner = ownerUserId
    ? await db.query.user.findFirst({
        where: eq(user.id, ownerUserId),
        columns: { grandfatheredAt: true },
      })
    : undefined;
  const accessLevel = newAccountAccessLevel(
    await isFeatureOn(db, "billing"),
    owner?.grandfatheredAt != null,
  );
  const [account] = await db
    .insert(billingAccount)
    .values({ ownerUserId, accessLevel })
    .returning({ id: billingAccount.id });
  if (!account) throw new Error("billing account insert returned no row");
  return account.id;
};

/**
 * Delete an account nothing uses any more: no company points at it, no invoice was ever issued to
 * it, and no order for it is waiting to be checked in Qonto. Accounts with invoices are kept,
 * because issued invoices must be kept; an account under an order check is kept because an invoice
 * may exist for it that we did not record. Returns whether it was deleted.
 */
export const deleteBillingAccountIfUnused = async (
  db: DbOrTx,
  accountId: string,
): Promise<boolean> => {
  const inUse = await db.query.company.findFirst({
    where: eq(company.billingAccountId, accountId),
    columns: { id: true },
  });
  const invoiced = await db.query.invoice.findFirst({
    where: eq(invoice.billingAccountId, accountId),
    columns: { id: true },
  });
  const [checking] = await db
    .select({ id: orderCheck.billingAccountId })
    .from(orderCheck)
    .where(eq(orderCheck.billingAccountId, accountId))
    .limit(1);
  if (inUse || invoiced || checking) return false;
  const deleted = await db
    .delete(billingAccount)
    .where(eq(billingAccount.id, accountId))
    .returning({ id: billingAccount.id });
  return deleted.length > 0;
};
