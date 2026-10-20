/**
 * The facts `billingStateOf` (./account-state) decides from, read for one session, and the one
 * write the state machine asks for: recording that the customer gave up the money back.
 */
import "@/lib/server-guard";
import { and, eq, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, company, invoice } from "@/schema";
import { type BillingFacts, type BillingState, billingStateOf } from "./account-state";
import type { AccessLevel } from "./accounts";
import { cancelWindowFor, originalInvoice } from "./money-back";
import { findActiveInvoice } from "./place-order";
import { paysOnUse } from "./terms";

export interface BillingSession {
  readonly companyId: string | null;
  readonly accessLevel: AccessLevel | null;
}

/** The company's billing account; a lookup by the company's primary key, so one row at most. */
const accountIdOf = async (db: DbOrTx, companyId: string): Promise<string | null> => {
  const [row] = await db
    .select({ id: billingAccount.id })
    .from(company)
    .innerJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(eq(company.id, companyId));
  return row?.id ?? null;
};

/**
 * The money back a first export or sign-off would end: the running order's thirty days, if they
 * still stand and the order was placed under terms that tie them to export and sign-off. An order
 * under earlier terms keeps its money back whatever is exported or signed.
 */
const endableMoneyBack = async (db: DbOrTx, accountId: string, now: Date) => {
  const active = await findActiveInvoice(db, accountId, now);
  if (!active) return null;
  const window = await cancelWindowFor(db, accountId, active, now);
  if (window.kind !== "money_back") return null;
  const original = await originalInvoice(db, active);
  const [terms] = await db
    .select({ version: invoice.termsVersion })
    .from(invoice)
    .where(eq(invoice.id, original.id))
    .limit(1);
  return paysOnUse(terms?.version ?? null)
    ? { lastDay: window.lastDay, invoiceId: original.id }
    : null;
};

/** Only a full account has an order whose money back an export or sign-off could end. */
export async function billingFactsOf(
  db: DbOrTx,
  session: BillingSession,
  now = new Date(),
): Promise<BillingFacts> {
  const none = { level: session.accessLevel, moneyBack: null } as const;
  if (!session.companyId) return { ...none, level: null };
  if (session.accessLevel !== "full") return none;
  const accountId = await accountIdOf(db, session.companyId);
  if (!accountId) return none;
  return { ...none, moneyBack: await endableMoneyBack(db, accountId, now) };
}

export const billingStateFor = async (
  db: DbOrTx,
  session: BillingSession,
  now = new Date(),
): Promise<BillingState> => billingStateOf(await billingFactsOf(db, session, now));

/**
 * The customer gives up the money back with a first export or sign-off, confirmed by `userId`.
 * Written once on the order's first invoice, which is where the thirty days are counted; a second
 * confirmation changes nothing. Returns whether there was a money back to give up.
 */
export async function waiveMoneyBack(
  db: DbOrTx,
  session: BillingSession,
  input: { readonly userId: string; readonly through: "export" | "sign_off" },
  now = new Date(),
): Promise<boolean> {
  if (!session.companyId || session.accessLevel !== "full") return false;
  const accountId = await accountIdOf(db, session.companyId);
  if (!accountId) return false;
  const moneyBack = await endableMoneyBack(db, accountId, now);
  if (!moneyBack) return false;
  await db
    .update(invoice)
    .set({
      moneyBackWaivedAt: now,
      moneyBackWaivedThrough: input.through,
      moneyBackWaivedByUserId: input.userId,
    })
    .where(and(eq(invoice.id, moneyBack.invoiceId), isNull(invoice.moneyBackWaivedAt)));
  return true;
}
