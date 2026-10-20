/**
 * AGB B9, unpaid invoice: "If the invoice is not paid by the end of the due date, which is 30 days
 * after the invoice date, the Provider suspends access to the annual licence without a further
 * period. [...] When the payment arrives, the Provider reopens the annual licence for the rest of
 * the licence year." The wording is the same in every terms version since 26.09.2026, so it holds
 * for every order.
 *
 * Suspending is what the Subscriptions tab's revoke does by hand: a full account falls back to the
 * level it has without a licence (`unpaidAccessLevel`, B7 and B10), where Billing, Settings,
 * Organisation, Notifications and Export stay reachable. Nothing is stored about the suspension:
 * an account below full whose latest invoice is uncredited, paid and still in its licence year is
 * owed its licence, whoever took it away, so that is what reopens it.
 *
 * Pure, so every case is a test (non-payment.test.ts); the sweep that applies it is
 * ./non-payment-schedule.
 */
import type { AccessLevel } from "./accounts";
import type { QontoStatus } from "./invoice-status";
import { shiftDay } from "./order";

/** B5: the invoice is payable within 30 days of the invoice date. */
const PAYMENT_TERM_DAYS = 30;

/** An account's latest invoice, as our tables keep it. */
export interface LatestInvoice {
  readonly issueDate: string;
  /** The last day of the licence year it pays for. */
  readonly periodEnd: string;
  /** A credit note cancelled it: a cancel inside the thirty days, or a reissue. */
  readonly credited: boolean;
}

/**
 * Whether the sweep needs Qonto's word on this invoice at all, so paying customers are not asked
 * about every hour. A full account only once the earliest due date B5 allows has passed, and not
 * again once its invoice was seen paid (`seenPaid`); an account below full only while the licence
 * year it may be reopened for runs.
 */
export const needsQonto = (
  level: AccessLevel,
  invoice: LatestInvoice,
  today: string,
  seenPaid: boolean,
): boolean => {
  if (invoice.credited) return false;
  if (level === "full") {
    return !seenPaid && today > shiftDay(invoice.issueDate, { days: PAYMENT_TERM_DAYS });
  }
  return today <= invoice.periodEnd;
};

export type NonPaymentAction = "suspend" | "reopen" | "none";

/**
 * What B9 asks for one account now. `status` and `dueDate` are Qonto's; when Qonto could not be
 * read (null), nothing changes: an outage never locks a paying customer out. The due date printed
 * on the invoice decides, and "by the end of the due date" means the first Berlin day after it.
 */
export const nonPaymentAction = (facts: {
  readonly level: AccessLevel;
  readonly invoice: LatestInvoice;
  readonly status: QontoStatus | null;
  readonly dueDate: string | null;
  readonly today: string;
}): NonPaymentAction => {
  const { level, invoice, status, dueDate, today } = facts;
  if (invoice.credited || status === null) return "none";
  if (level === "full") {
    return status === "unpaid" && dueDate !== null && today > dueDate
      ? "suspend"
      : "none";
  }
  return status === "paid" && today <= invoice.periodEnd ? "reopen" : "none";
};

/** One account the sweep looks at, with its latest invoice. */
export interface Candidate {
  readonly accountId: string;
  readonly level: AccessLevel;
  readonly invoice: LatestInvoice & {
    readonly qontoInvoiceId: string;
    readonly number: string;
  };
}

/** One change the sweep made, for the audit log and the operators. */
export interface Applied {
  readonly accountId: string;
  readonly action: Exclude<NonPaymentAction, "none">;
  readonly invoiceNumber: string;
  readonly dueDate: string | null;
  /** The level the account has now. */
  readonly level: AccessLevel;
}

export interface SweepResult {
  readonly applied: readonly Applied[];
  /** Invoices Qonto was asked about but did not answer readably: nothing changed for them. */
  readonly unreadable: readonly string[];
}

/**
 * Apply B9 to every candidate, one at a time. Each change is a conditional update (`suspend` only
 * moves a full account, `reopen` only one below full), so a revoke or an order by a person in the
 * meantime wins; a change that found nothing to change is not reported.
 */
export const sweepNonPayment = async (deps: {
  readonly candidates: readonly Candidate[];
  readonly today: string;
  /** Invoices already seen paid by this server, which a full account need not ask about again. */
  readonly seenPaid: Set<string>;
  readonly read: (
    qontoInvoiceId: string,
  ) => Promise<{ readonly status: QontoStatus | null; readonly dueDate: string | null }>;
  readonly suspend: (accountId: string) => Promise<AccessLevel | null>;
  readonly reopen: (accountId: string) => Promise<boolean>;
}): Promise<SweepResult> => {
  const applied: Applied[] = [];
  const unreadable: string[] = [];
  for (const c of deps.candidates) {
    const seen = deps.seenPaid.has(c.invoice.qontoInvoiceId);
    if (!needsQonto(c.level, c.invoice, deps.today, seen)) continue;
    const live = await deps.read(c.invoice.qontoInvoiceId);
    if (live.status === null) {
      unreadable.push(c.invoice.number);
      continue;
    }
    if (live.status === "paid") deps.seenPaid.add(c.invoice.qontoInvoiceId);
    const action = nonPaymentAction({ ...c, ...live, today: deps.today });
    const base = {
      accountId: c.accountId,
      invoiceNumber: c.invoice.number,
      dueDate: live.dueDate,
    };
    if (action === "suspend") {
      const level = await deps.suspend(c.accountId);
      if (level) applied.push({ ...base, action, level });
    } else if (action === "reopen" && (await deps.reopen(c.accountId))) {
      applied.push({ ...base, action, level: "full" });
    }
  }
  return { applied, unreadable };
};
