/**
 * The durable block after an unclear order (billing_account.order_check_since).
 *
 * When Qonto does not answer an order clearly, an invoice may exist that we did not record. The
 * customer is told not to order again, and this makes that true on the server too: every further
 * order for the account is refused, from either door, any browser, any device, until a platform
 * admin has looked in Qonto and cleared it (the Pricing tab). The operators are alerted when it is
 * set (./place-order).
 */
import "@/lib/server-guard";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, user } from "@/schema";

/** Block further orders for this account. Keeps the time it was first set. */
export const markOrderCheck = async (db: DbOrTx, billingAccountId: string, now: Date) => {
  await db
    .update(billingAccount)
    .set({ orderCheckSince: now })
    .where(
      and(
        eq(billingAccount.id, billingAccountId),
        isNull(billingAccount.orderCheckSince),
      ),
    );
};

/** Lift the block once someone has checked Qonto. Returns whether there was one to lift. */
export const clearOrderCheck = async (db: DbOrTx, billingAccountId: string) => {
  const cleared = await db
    .update(billingAccount)
    .set({ orderCheckSince: null })
    .where(
      and(
        eq(billingAccount.id, billingAccountId),
        isNotNull(billingAccount.orderCheckSince),
      ),
    )
    .returning({ id: billingAccount.id });
  return cleared.length === 1;
};

/** Every blocked account, oldest first, with who holds it: the list a platform admin works through. */
export const listOrderChecks = (db: DbOrTx) =>
  db
    .select({
      billingAccountId: billingAccount.id,
      since: billingAccount.orderCheckSince,
      ownerEmail: user.email,
      qontoClientId: billingAccount.qontoClientId,
    })
    .from(billingAccount)
    .leftJoin(user, eq(user.id, billingAccount.ownerUserId))
    .where(isNotNull(billingAccount.orderCheckSince))
    .orderBy(asc(billingAccount.orderCheckSince));
