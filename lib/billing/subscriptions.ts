/**
 * The platform admin Subscriptions tab: every paying customer, the invoice paying for them now with
 * its status read live from Qonto, and every refund still owed. Refunds are never automatic (a
 * credit note moves no money), so this list is what stops one being forgotten.
 *
 * A subscription is an account that is full or has ever been invoiced. Free and grandfathered
 * accounts that never ordered are not listed: there would be hundreds, with nothing to act on.
 */
import "@/lib/server-guard";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { DbOrTx } from "@/lib/db";
import {
  billingAccount,
  company,
  companyMembership,
  creditNote,
  invoice,
  user,
} from "@/schema";
import { unpaidAccessLevel } from "./access";
import type { AccessLevel } from "./accounts";
import { cancelWindow } from "./cancel-terms";
import { isGrandfatheredHolder } from "./holder-price";
import { formatEuro, invoiceToday } from "./order";
import type { OrderingMode } from "./ordering";
import { getInvoice } from "./qonto";
import { httpsHostOf } from "./sandbox-gate";

/** Qonto's status, plus overdue: unpaid past its due date. Null when Qonto could not be read. */
export type LiveStatus = "paid" | "unpaid" | "overdue" | "canceled" | "draft" | null;

const QONTO_STATUSES = ["paid", "unpaid", "canceled", "draft"] as const;
type QontoStatus = (typeof QONTO_STATUSES)[number];
const isQontoStatus = (s: string | undefined): s is QontoStatus =>
  QONTO_STATUSES.some((k) => k === s);

const isoDay = z.iso.date();

/** What Qonto says about an invoice now. Every field is checked, because it is an outside answer. */
const readLive = async (mode: OrderingMode, qontoInvoiceId: string) => {
  const none = { status: null, dueDate: null, url: null, customerName: null } as const;
  if (mode.kind === "off") return none;
  const res = await getInvoice(mode.qonto, qontoInvoiceId);
  const record = res.ok ? res.data.client_invoice : undefined;
  if (!record) return none;
  return {
    status: isQontoStatus(record.status) ? record.status : null,
    dueDate: isoDay.safeParse(record.due_date).data ?? null,
    url:
      record.invoice_url && httpsHostOf(record.invoice_url) ? record.invoice_url : null,
    customerName: typeof record.client?.name === "string" ? record.client.name : null,
  };
};

const withOverdue = (
  status: QontoStatus | null,
  dueDate: string | null,
  now: Date,
): LiveStatus =>
  status === "unpaid" && dueDate !== null && invoiceToday(now) > dueDate
    ? "overdue"
    : status;

export const listSubscriptions = async (
  db: DbOrTx,
  mode: OrderingMode,
  now = new Date(),
) => {
  const accounts = await db
    .select({
      id: billingAccount.id,
      accessLevel: billingAccount.accessLevel,
      renewalCanceledAt: billingAccount.renewalCanceledAt,
      ownerEmail: user.email,
    })
    .from(billingAccount)
    .leftJoin(user, eq(user.id, billingAccount.ownerUserId))
    .where(
      or(
        eq(billingAccount.accessLevel, "full"),
        exists(
          db
            .select({ id: invoice.id })
            .from(invoice)
            .where(eq(invoice.billingAccountId, billingAccount.id)),
        ),
      ),
    )
    .orderBy(desc(billingAccount.updatedAt));
  if (accounts.length === 0) return [];
  const ids = accounts.map((a) => a.id);

  const [companies, people, invoices, refunds] = await Promise.all([
    db
      .select({ accountId: company.billingAccountId, n: count() })
      .from(company)
      .where(inArray(company.billingAccountId, ids))
      .groupBy(company.billingAccountId),
    db
      .select({
        accountId: company.billingAccountId,
        n: countDistinct(companyMembership.userId),
      })
      .from(companyMembership)
      .innerJoin(company, eq(company.id, companyMembership.companyId))
      .where(inArray(company.billingAccountId, ids))
      .groupBy(company.billingAccountId),
    db
      .select({
        accountId: invoice.billingAccountId,
        qontoInvoiceId: invoice.qontoInvoiceId,
        number: invoice.number,
        netCents: invoice.netCents,
        vatCents: invoice.vatCents,
        issueDate: invoice.issueDate,
        periodEnd: invoice.periodEnd,
        creditNoteNumber: creditNote.number,
      })
      .from(invoice)
      .leftJoin(creditNote, eq(creditNote.invoiceId, invoice.id))
      .where(inArray(invoice.billingAccountId, ids))
      .orderBy(desc(invoice.issueDate), desc(invoice.createdAt)),
    listRefunds(db, ids),
  ]);

  return Promise.all(
    accounts.map(async (a) => {
      const latest = invoices.find((i) => i.accountId === a.id);
      const live = latest ? await readLive(mode, latest.qontoInvoiceId) : null;
      const current =
        latest && live
          ? (() => {
              const window = cancelWindow(latest.issueDate, now);
              return {
                number: latest.number,
                gross: formatEuro(latest.netCents + latest.vatCents),
                net: formatEuro(latest.netCents),
                issueDate: latest.issueDate,
                dueDate: live.dueDate,
                periodEnd: latest.periodEnd,
                status: withOverdue(live.status, live.dueDate, now),
                qontoUrl: live.url,
                creditNoteNumber: latest.creditNoteNumber,
                windowDay: window.day,
                insideWindow: window.kind === "money_back" && !latest.creditNoteNumber,
              };
            })()
          : null;
      const accountRefunds = refunds.filter((r) => r.accountId === a.id);
      return {
        billingAccountId: a.id,
        ownerEmail: a.ownerEmail,
        customerName: live?.customerName ?? null,
        accessLevel: a.accessLevel,
        companies: companies.find((c) => c.accountId === a.id)?.n ?? 0,
        users: people.find((p) => p.accountId === a.id)?.n ?? 0,
        renewalCanceledAt: a.renewalCanceledAt,
        invoice: current,
        refunds: accountRefunds.map(({ accountId: _, ...r }) => r),
        refundOwed: accountRefunds.some((r) => r.doneAt === null),
      };
    }),
  );
};

/** Every credit note that owed a refund, done or not, with who recorded it and when. */
const listRefunds = (db: DbOrTx, accountIds: readonly string[]) => {
  const doneBy = alias(user, "refund_done_by");
  return db
    .select({
      accountId: invoice.billingAccountId,
      creditNoteId: creditNote.id,
      creditNoteNumber: creditNote.number,
      invoiceNumber: invoice.number,
      netCents: invoice.netCents,
      vatCents: invoice.vatCents,
      doneAt: creditNote.refundDoneAt,
      doneByEmail: doneBy.email,
    })
    .from(creditNote)
    .innerJoin(invoice, eq(invoice.id, creditNote.invoiceId))
    .leftJoin(doneBy, eq(doneBy.id, creditNote.refundDoneByUserId))
    .where(
      and(
        eq(creditNote.refundOwed, true),
        inArray(invoice.billingAccountId, [...accountIds]),
      ),
    )
    .orderBy(desc(creditNote.createdAt))
    .then((rows) =>
      rows.map(({ netCents, vatCents, ...r }) => ({
        ...r,
        gross: formatEuro(netCents + vatCents),
      })),
    );
};

/**
 * Revoke by hand, for an invoice that stays unpaid: a full account falls back to what it has
 * without payment, the same level a cancel inside the thirty days leaves it at (./access). Only a
 * full account can be revoked. Returns the new level, or null when there was nothing to revoke.
 */
export const revokeAccess = async (
  db: DbOrTx,
  billingAccountId: string,
  now = new Date(),
): Promise<AccessLevel | null> => {
  const [account] = await db
    .select({ ownerUserId: billingAccount.ownerUserId })
    .from(billingAccount)
    .where(eq(billingAccount.id, billingAccountId))
    .limit(1);
  if (!account) return null;
  const level = unpaidAccessLevel(await isGrandfatheredHolder(db, account.ownerUserId));
  const revoked = await db
    .update(billingAccount)
    .set({ accessLevel: level, updatedAt: now })
    .where(
      and(
        eq(billingAccount.id, billingAccountId),
        eq(billingAccount.accessLevel, "full"),
      ),
    )
    .returning({ id: billingAccount.id });
  return revoked.length === 1 ? level : null;
};

/**
 * Record that the refund transfer was made in Qonto. Only a refund that was owed and is not yet
 * recorded, which is also what the table's CHECK constraints allow. Returns the credit note's
 * number, or null when there was nothing to record.
 */
export const markRefundDone = async (
  db: DbOrTx,
  creditNoteId: string,
  byUserId: string,
  now = new Date(),
): Promise<string | null> => {
  const [done] = await db
    .update(creditNote)
    .set({ refundDoneAt: now, refundDoneByUserId: byUserId })
    .where(
      and(
        eq(creditNote.id, creditNoteId),
        eq(creditNote.refundOwed, true),
        isNull(creditNote.refundDoneAt),
      ),
    )
    .returning({ number: creditNote.number });
  return done?.number ?? null;
};
