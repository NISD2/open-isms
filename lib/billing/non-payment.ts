/**
 * AGB B9, unpaid invoice: "If the invoice is not paid by the end of the due date, which is 30 days
 * after the invoice date, the Provider suspends access to the annual licence without a further
 * period. [...] When the payment arrives, the Provider reopens the annual licence for the rest of
 * the licence year." The wording is the same in every terms version since 26.09.2026, so it holds
 * for every order.
 *
 * Suspending is what the Subscriptions tab's revoke does by hand: a full account falls back to the
 * level it has without a licence (`unpaidAccessLevel`, B7 and B10), where Billing, Settings,
 * Organisation, Notifications and Export stay reachable. The payment reopens only what B9 itself
 * suspended: an account whose latest access change is a B9 suspension (`reopenable`), with its
 * latest invoice uncredited, paid and still in its licence year. A revoke by a person stays.
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
  /** B9 itself suspended the account: its latest access change is a B9 suspension. */
  readonly reopenable: boolean;
}): NonPaymentAction => {
  const { level, invoice, status, dueDate, today, reopenable } = facts;
  if (invoice.credited || status === null) return "none";
  if (level === "full") {
    return status === "unpaid" && dueDate !== null && today > dueDate
      ? "suspend"
      : "none";
  }
  return reopenable && status === "paid" && today <= invoice.periodEnd
    ? "reopen"
    : "none";
};

/** How many days before the due date the account is told what B9 will do. */
const WARN_DAYS = 7;

export type NonPaymentNotice =
  /** The invoice is still open and its due date is close: what happens if it stays unpaid. */
  | { readonly kind: "due"; readonly dueDate: string }
  /** The licence is suspended for this invoice: what reopens it. */
  | { readonly kind: "suspended"; readonly dueDate: string };

/**
 * What the account is told, in the app, about its open invoice. B9 needs no notice; the lock comes
 * "without a further period". It is shown anyway, because a lock nobody announced reads as an
 * error, and because it says how to get back in. Only the invoice B9 would act on counts: the
 * latest, uncredited, unpaid in Qonto.
 */
export const nonPaymentNotice = (facts: {
  readonly level: AccessLevel;
  readonly invoice: LatestInvoice;
  readonly status: QontoStatus | null;
  readonly dueDate: string | null;
  readonly today: string;
}): NonPaymentNotice | null => {
  const { level, invoice, status, dueDate, today } = facts;
  if (invoice.credited || status !== "unpaid" || dueDate === null) return null;
  if (level === "full") {
    return today <= dueDate && today >= shiftDay(dueDate, { days: -WARN_DAYS })
      ? { kind: "due", dueDate }
      : null;
  }
  return today > dueDate && today <= invoice.periodEnd
    ? { kind: "suspended", dueDate }
    : null;
};

/**
 * Whether a notice could apply, so a page asks Qonto only then: a full account from a week before
 * the earliest due date B5 allows, an account below full while its licence year runs.
 */
export const noticeNeedsQonto = (
  level: AccessLevel,
  invoice: LatestInvoice,
  today: string,
): boolean => {
  if (invoice.credited) return false;
  return level === "full"
    ? today >= shiftDay(invoice.issueDate, { days: PAYMENT_TERM_DAYS - WARN_DAYS })
    : today <= invoice.periodEnd;
};

/** One account the sweep looks at, with its latest invoice. */
export interface Candidate {
  readonly accountId: string;
  readonly level: AccessLevel;
  readonly invoice: LatestInvoice & {
    readonly qontoInvoiceId: string;
    readonly number: string;
  };
  /** Its latest access change is a B9 suspension, so a payment may reopen it. */
  readonly reopenable: boolean;
}

/** A change the sweep is about to make: what its audit row and the operators are told. */
export interface Change {
  readonly accountId: string;
  readonly invoiceNumber: string;
  readonly dueDate: string | null;
  /** The level the account had before. */
  readonly from: AccessLevel;
}

/** One change the sweep made, for the audit log and the operators. */
export interface Applied extends Change {
  readonly action: Exclude<NonPaymentAction, "none">;
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
 * meantime wins; a change that found nothing to change is not reported. An account below full that
 * B9 did not suspend is not asked about: nothing would reopen it.
 */
export const sweepNonPayment = async (deps: {
  readonly candidates: readonly Candidate[];
  readonly today: string;
  /** Invoices already seen paid by this server, which a full account need not ask about again. */
  readonly seenPaid: Set<string>;
  readonly read: (
    qontoInvoiceId: string,
  ) => Promise<{ readonly status: QontoStatus | null; readonly dueDate: string | null }>;
  /** Suspend and record it in one step; the new level, or null when there was nothing to do. */
  readonly suspend: (change: Change) => Promise<AccessLevel | null>;
  /** Reopen and record it in one step; whether it changed anything. */
  readonly reopen: (change: Change) => Promise<boolean>;
}): Promise<SweepResult> => {
  const applied: Applied[] = [];
  const unreadable: string[] = [];
  for (const c of deps.candidates) {
    const seen = deps.seenPaid.has(c.invoice.qontoInvoiceId);
    if (c.level !== "full" && !c.reopenable) continue;
    if (!needsQonto(c.level, c.invoice, deps.today, seen)) continue;
    const live = await deps.read(c.invoice.qontoInvoiceId);
    if (live.status === null) {
      unreadable.push(c.invoice.number);
      continue;
    }
    if (live.status === "paid") deps.seenPaid.add(c.invoice.qontoInvoiceId);
    const action = nonPaymentAction({ ...c, ...live, today: deps.today });
    const change: Change = {
      accountId: c.accountId,
      invoiceNumber: c.invoice.number,
      dueDate: live.dueDate,
      from: c.level,
    };
    if (action === "suspend") {
      const level = await deps.suspend(change);
      if (level) applied.push({ ...change, action, level });
    } else if (action === "reopen" && (await deps.reopen(change))) {
      applied.push({ ...change, action, level: "full" });
    }
  }
  return { applied, unreadable };
};
