/**
 * The durable block after an unclear order (the `order_check` table).
 *
 * An order writes its row in its own committed statement just before asking Qonto for the invoice,
 * and deletes it in the order's transaction once Qonto has clearly issued or clearly refused. So a
 * row that stays means Qonto did not answer clearly, or the order broke after the call, and an
 * invoice may exist that we did not record. While a row exists every order for the account is
 * refused, from either door and any device, until a platform admin has checked Qonto and cleared
 * it (the Pricing tab). A failure before the Qonto call writes no row and blocks nothing.
 */
import "@/lib/server-guard";
import { asc, eq } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import { billingAccount, orderCheck, user } from "@/schema";

/**
 * Mark an order as in flight at Qonto. On the pool, not the order's transaction, so it stays
 * committed whatever happens to the transaction afterwards.
 */
export const markOrderCheck = async (
  db: Database,
  billingAccountId: string,
  invoiceNumber: string,
  now: Date,
) => {
  await db
    .insert(orderCheck)
    .values({ billingAccountId, invoiceNumber, since: now })
    .onConflictDoNothing({ target: orderCheck.billingAccountId });
};

/** Whether an earlier order for this account is still unresolved. */
export const hasOrderCheck = async (db: DbOrTx, billingAccountId: string) => {
  const [row] = await db
    .select({ id: orderCheck.billingAccountId })
    .from(orderCheck)
    .where(eq(orderCheck.billingAccountId, billingAccountId))
    .limit(1);
  return row !== undefined;
};

/** Remove the mark: Qonto answered clearly, or someone checked Qonto. Returns whether one existed. */
export const clearOrderCheck = async (db: DbOrTx, billingAccountId: string) => {
  const cleared = await db
    .delete(orderCheck)
    .where(eq(orderCheck.billingAccountId, billingAccountId))
    .returning({ id: orderCheck.billingAccountId });
  return cleared.length === 1;
};

/** Every blocked account, oldest first, with its holder and the number to look up in Qonto. */
export const listOrderChecks = (db: DbOrTx) =>
  db
    .select({
      billingAccountId: orderCheck.billingAccountId,
      invoiceNumber: orderCheck.invoiceNumber,
      since: orderCheck.since,
      ownerEmail: user.email,
      qontoClientId: billingAccount.qontoClientId,
    })
    .from(orderCheck)
    .innerJoin(billingAccount, eq(billingAccount.id, orderCheck.billingAccountId))
    .leftJoin(user, eq(user.id, billingAccount.ownerUserId))
    .orderBy(asc(orderCheck.since));
