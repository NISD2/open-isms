/**
 * The facts `billingStateOf` (./account-state) decides from, read for one session, and the one
 * write the state machine asks for: recording that the customer gave up the money back.
 */
import "@/lib/server-guard";
import { and, eq, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, company, creditNote, invoice } from "@/schema";
import { type BillingFacts, type BillingState, billingStateOf } from "./account-state";
import type { AccessLevel } from "./accounts";
import { cancelWindowFor, originalInvoice } from "./money-back";
import { billingFor } from "./ordering-access";
import { findActiveInvoice } from "./place-order";
import { getInvoice } from "./qonto";
import { paysOnUse } from "./terms";

export interface BillingSession {
  readonly companyId: string | null;
  readonly accessLevel: AccessLevel | null;
  readonly user: { readonly email?: string | null };
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

/**
 * Whether an account without a licence paid for one at some point. An order under earlier terms
 * counts whatever happened to it, because those terms keep a former customer's exports open (B10
 * before PAY_ON_USE_SINCE). Under the current terms an invoice counts once Qonto says it is paid
 * and it was not credited: money back that was refunded is not a payment. Qonto is only asked when
 * there is such an invoice, and an answer it cannot give counts as not paid.
 */
const everPaid = async (
  db: DbOrTx,
  accountId: string,
  email: string | null | undefined,
): Promise<boolean> => {
  const rows = await db
    .select({
      qontoInvoiceId: invoice.qontoInvoiceId,
      termsVersion: invoice.termsVersion,
      credited: creditNote.id,
    })
    .from(invoice)
    .leftJoin(creditNote, eq(creditNote.invoiceId, invoice.id))
    .where(eq(invoice.billingAccountId, accountId));
  if (rows.some((r) => !paysOnUse(r.termsVersion))) return true;
  const open = rows.filter((r) => r.credited === null);
  const { mode } = billingFor(email);
  if (open.length === 0 || mode.kind === "off") return false;
  const statuses = await Promise.all(
    open.map(async (r) => {
      const res = await getInvoice(mode.qonto, r.qontoInvoiceId);
      return res.ok ? (res.data.client_invoice?.status ?? null) : null;
    }),
  );
  return statuses.includes("paid");
};

export async function billingFactsOf(
  db: DbOrTx,
  session: BillingSession,
  now = new Date(),
): Promise<BillingFacts> {
  const none = { level: session.accessLevel, moneyBack: null, everPaid: false } as const;
  if (!session.companyId) return { ...none, level: null };
  const accountId = await accountIdOf(db, session.companyId);
  if (!accountId) return none;
  switch (session.accessLevel) {
    case "full":
      return { ...none, moneyBack: await endableMoneyBack(db, accountId, now) };
    case "grandfathered":
      return none;
    default:
      return { ...none, everPaid: await everPaid(db, accountId, session.user.email) };
  }
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
