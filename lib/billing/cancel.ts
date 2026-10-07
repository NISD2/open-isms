/**
 * Cancel: the one function that ends a paid year, for the account holder only (billing.cancel).
 *
 *   - Inside the thirty days of the account's first invoice (cancelWindowFor): a full credit
 *     note in Qonto, which cancels the
 *     invoice whether it was paid or not. Our credit_note row is written, the account falls back
 *     to the level it has without payment (./access unpaidAccessLevel), and if the invoice had been
 *     paid the refund is marked owed: a credit note moves no money, and our key cannot send a
 *     transfer, so the operators are told the amount and the last day, a person makes it in Qonto
 *     and records it in the Subscriptions tab, and recording it emails the customer
 *     (./refund-sent).
 *   - After them, or on any later invoice: `renewal_canceled_at` is set and access runs to the
 *     end of the paid year.
 *
 * The credit note follows the order's safety pattern (./place-order): everything that can refuse
 * is decided before Qonto is called, the number is committed before the call, the account is
 * locked, and an `order_check` mark is committed just before the call and removed once Qonto has
 * answered clearly. An unclear answer leaves the mark, which blocks further orders and cancels for
 * the account until a platform admin has checked Qonto, and the operators are told.
 *
 * Either cancel ends in a confirmation to the holder (./cancel-notice): sent at once when they
 * cancel under Billing, carried by the erasure confirmation when they delete their account.
 */
import "@/lib/server-guard";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database, DbOrTx } from "@/lib/db";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { billingAccount, creditNote, invoice, user } from "@/schema";
import { unpaidAccessLevel } from "./access";
import type { AccessLevel } from "./accounts";
import { AlreadyAlerted, alertOperators } from "./alert";
import { type CancelNotice, type HolderContact, sendCancelNotice } from "./cancel-notice";
import {
  type CancelWindow,
  cancelWindow,
  creditNoteLine,
  creditNoteReason,
  refundDueDay,
} from "./cancel-terms";
import { takeDocumentNumber } from "./document-number";
import { isGrandfatheredHolder } from "./holder-price";
import { sandboxInvoiceNumber } from "./invoice-number";
import { formatEuro, formatInvoiceDay, invoiceToday } from "./order";
import { clearOrderCheck, hasOrderCheck, markOrderCheck } from "./order-check";
import type { OrderingMode } from "./ordering";
import { findActiveInvoice } from "./place-order";
import { createCreditNote, getInvoice } from "./qonto";

/** Gutschrift. Its own series in document_number_counter, so credit notes count on their own. */
export const CREDIT_NOTE_PREFIX = "GS";

export type CancelOutcome =
  | {
      readonly ok: true;
      readonly kind: "money_back";
      readonly creditNoteNumber: string;
      readonly refundOwed: boolean;
      readonly accessLevel: AccessLevel;
    }
  | {
      readonly ok: true;
      readonly kind: "renewal";
      readonly periodEnd: string;
      /** It had been canceled before; nothing changed and no second email went out. */
      readonly alreadyCanceled: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: /** No uncredited invoice whose year is still running. */
        | "no_invoice"
        /** An earlier order or cancel for this account is still being checked in Qonto. */
        | "pending"
        /** Qonto refused, or could not be read: nothing was issued. */
        | "qonto"
        /** Qonto did not answer clearly, or disagrees with us: the operators are told. */
        | "qonto_unknown";
      readonly message: string;
    };

export interface CancelInput {
  readonly db: Database;
  readonly mode: Exclude<OrderingMode, { readonly kind: "off" }>;
  readonly billingAccountId: string;
  /** The account holder, who asked for it. */
  readonly userId: string;
  readonly now?: Date;
}

/** A cancel and its confirmation, not sent yet: null when nothing changed or nobody is left to tell. */
export interface CancelMade {
  readonly outcome: CancelOutcome;
  readonly notice: CancelNotice | null;
}

const failure = (
  reason: Extract<CancelOutcome, { ok: false }>["reason"],
  message: string,
) => ({ ok: false, reason, message }) as const;

const unsent = (outcome: CancelOutcome): CancelMade => ({ outcome, notice: null });

/**
 * The order an invoice belongs to: the invoice itself, or, for one a platform admin reissued
 * (./reissue), the invoice at the start of that chain. Its id and issue date are what the thirty
 * days are counted from, because reissuing changes the paper and not the order.
 */
export const originalInvoice = async (
  db: DbOrTx,
  inv: { readonly id: string; readonly issueDate: string },
) => {
  let current = inv;
  // Bounded, so a chain that loops by some hand edit cannot hang a page.
  for (let hop = 0; hop < 10; hop++) {
    const [row] = await db
      .select({ replaces: invoice.replacesInvoiceId })
      .from(invoice)
      .where(eq(invoice.id, current.id))
      .limit(1);
    if (!row?.replaces) return current;
    const [prior] = await db
      .select({ id: invoice.id, issueDate: invoice.issueDate })
      .from(invoice)
      .where(eq(invoice.id, row.replaces))
      .limit(1);
    if (!prior) return current;
    current = prior;
  }
  return current;
};

/**
 * Which cancel applies to one of the account's invoices today: the one place the thirty days are
 * decided. An invoice is the first when no invoice of the account was created before it, credited
 * or not, so a renewal and a new order after a cancel never carry money back. A reissued invoice is
 * judged as the one it replaces (originalInvoice).
 */
export const cancelWindowFor = async (
  db: DbOrTx,
  billingAccountId: string,
  inv: { readonly id: string; readonly issueDate: string },
  now: Date,
): Promise<CancelWindow> => {
  const [earliest] = await db
    .select({ id: invoice.id })
    .from(invoice)
    .where(eq(invoice.billingAccountId, billingAccountId))
    .orderBy(asc(invoice.createdAt), asc(invoice.id))
    .limit(1);
  const original = await originalInvoice(db, inv);
  return cancelWindow(
    { issueDate: original.issueDate, firstInvoice: earliest?.id === original.id },
    now,
  );
};

/**
 * Which cancel the holder is offered, if any: money back inside the thirty days of the first
 * invoice, otherwise no renewal, once. Only a full account with a running, uncredited invoice has
 * anything to cancel.
 */
export const cancelOption = async (
  db: DbOrTx,
  account: {
    readonly id: string;
    readonly accessLevel: AccessLevel;
    readonly renewalCanceledAt: Date | null;
  },
  active: {
    readonly id: string;
    readonly issueDate: string;
    readonly periodEnd: string;
  } | null,
  now: Date,
) => {
  if (account.accessLevel !== "full" || !active) return null;
  const window = await cancelWindowFor(db, account.id, active, now);
  if (window.kind === "money_back") {
    return {
      kind: "money_back",
      lastDay: window.lastDay,
      periodEnd: active.periodEnd,
    } as const;
  }
  return account.renewalCanceledAt
    ? null
    : ({ kind: "renewal", reason: window.reason, periodEnd: active.periodEnd } as const);
};

/**
 * The cancel the account still has open (money back, or a renewal not yet stopped), or null.
 * Deleting the holder's account makes it first: afterwards nobody would be left who may cancel it.
 */
export const openCancel = async (db: DbOrTx, billingAccountId: string, now: Date) => {
  const [account] = await db
    .select({
      id: billingAccount.id,
      accessLevel: billingAccount.accessLevel,
      renewalCanceledAt: billingAccount.renewalCanceledAt,
    })
    .from(billingAccount)
    .where(eq(billingAccount.id, billingAccountId))
    .limit(1);
  if (!account) return null;
  return cancelOption(db, account, await findActiveInvoice(db, account.id, now), now);
};

/** The audit line for a cancel that went through, wherever it was asked for. */
export const cancelAuditDescription = (outcome: Extract<CancelOutcome, { ok: true }>) =>
  outcome.kind === "money_back"
    ? `Canceled inside the thirty days: credit note ${outcome.creditNoteNumber}${outcome.refundOwed ? ", refund owed" : ""}, access ${outcome.accessLevel}`
    : `Renewal canceled, access until ${outcome.periodEnd}${outcome.alreadyCanceled ? " (already canceled)" : ""}`;

/** The invoice paying for the account right now, with the facts a credit note mirrors. */
export const currentInvoice = async (db: DbOrTx, billingAccountId: string, now: Date) => {
  const active = await findActiveInvoice(db, billingAccountId, now);
  if (!active) return null;
  const [row] = await db
    .select({
      id: invoice.id,
      qontoInvoiceId: invoice.qontoInvoiceId,
      number: invoice.number,
      netCents: invoice.netCents,
      vatCents: invoice.vatCents,
      vatTreatment: invoice.vatTreatment,
      viesRequestIdentifier: invoice.viesRequestIdentifier,
      issueDate: invoice.issueDate,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      termsVersion: invoice.termsVersion,
      termsAcceptedAt: invoice.termsAcceptedAt,
      termsAcceptedByUserId: invoice.termsAcceptedByUserId,
    })
    .from(invoice)
    .where(and(eq(invoice.id, active.id), eq(invoice.billingAccountId, billingAccountId)))
    .limit(1);
  return row ?? null;
};

type CurrentInvoice = NonNullable<Awaited<ReturnType<typeof currentInvoice>>>;

const holderContact = async (
  db: DbOrTx,
  userId: string,
): Promise<HolderContact | null> => {
  const [row] = await db
    .select({ email: user.email, locale: user.locale })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ? { email: row.email, locale: resolveEmailLocale(row.locale, null) } : null;
};

const cancelRenewal = async (
  input: CancelInput,
  current: CurrentInvoice,
  reason: Extract<CancelWindow, { kind: "renewal" }>["reason"],
  now: Date,
): Promise<CancelMade> => {
  // The same lock an order and a money-back cancel take, and the same refusal while an earlier
  // order or cancel is still being checked in Qonto.
  const marked = await input.db.transaction(async (tx) => {
    await tx
      .select({ id: billingAccount.id })
      .from(billingAccount)
      .where(eq(billingAccount.id, input.billingAccountId))
      .for("no key update");
    if (await hasOrderCheck(tx, input.billingAccountId)) return null;
    return tx
      .update(billingAccount)
      .set({ renewalCanceledAt: now, updatedAt: now })
      .where(
        and(
          eq(billingAccount.id, input.billingAccountId),
          isNull(billingAccount.renewalCanceledAt),
        ),
      )
      .returning({ id: billingAccount.id });
  });
  if (!marked) {
    return unsent(
      failure("pending", "An earlier order or cancel is still being checked."),
    );
  }
  const alreadyCanceled = marked.length === 0;
  const holder = alreadyCanceled ? null : await holderContact(input.db, input.userId);
  return {
    outcome: { ok: true, kind: "renewal", periodEnd: current.periodEnd, alreadyCanceled },
    notice: holder
      ? {
          kind: "renewal",
          billingAccountId: input.billingAccountId,
          holder,
          invoiceNumber: current.number,
          periodEnd: current.periodEnd,
          reason,
        }
      : null,
  };
};

/** The client email Qonto answered with, when it really is an address and not the holder's. */
export const accountingCopy = (candidate: string | null | undefined, holder: string) =>
  candidate &&
  z.email().safeParse(candidate).success &&
  candidate.toLowerCase() !== holder.toLowerCase()
    ? [candidate]
    : [];

const creditInvoice = async (
  input: CancelInput,
  current: CurrentInvoice,
  now: Date,
): Promise<CancelMade> => {
  const { db, mode } = input;

  // Whether it was paid decides whether money is owed back, and the credit note makes Qonto's
  // status "canceled" for good, so it is read now, before anything is issued.
  const live = await getInvoice(mode.qonto, current.qontoInvoiceId);
  const status = live.ok ? live.data.client_invoice?.status : undefined;
  if (status !== "paid" && status !== "unpaid") {
    if (status === undefined) {
      return unsent(failure("qonto", "Qonto could not be read. Nothing was canceled."));
    }
    void alertOperators(`${current.number} ist in Qonto ${status}`, [
      `Der Kunde will ${current.number} innerhalb der 30 Tage kündigen. Bei uns ist die Rechnung aktiv, in Qonto hat sie den Status ${status}.`,
      `Billing account ${input.billingAccountId}. In Qonto nachsehen, die Gutschrift von Hand anlegen oder die Zeile nachtragen, und den Zugang von Hand setzen.`,
    ]);
    return unsent(failure("qonto_unknown", `Qonto reports the invoice as ${status}.`));
  }
  const refundOwed = status === "paid";
  const docLocale = current.vatTreatment === "domestic" ? "de" : "en";
  const progress = { qontoCalled: false };

  const outcome = await db
    .transaction(async (tx) => {
      // The same lock an order takes, so an order and a cancel for one account never overlap.
      const [account] = await tx
        .select({ id: billingAccount.id, ownerUserId: billingAccount.ownerUserId })
        .from(billingAccount)
        .where(eq(billingAccount.id, input.billingAccountId))
        .for("no key update");
      if (!account) return failure("no_invoice", "No billing account.");
      if (await hasOrderCheck(tx, account.id)) {
        return failure("pending", "An earlier order or cancel is still being checked.");
      }
      // Under the lock: a second click waited for the first and finds its credit note here.
      const [credited] = await tx
        .select({ id: creditNote.id })
        .from(creditNote)
        .where(eq(creditNote.invoiceId, current.id))
        .limit(1);
      if (credited) return failure("no_invoice", "This invoice is already credited.");

      const level = unpaidAccessLevel(
        await isGrandfatheredHolder(tx, account.ownerUserId),
      );
      const issueDate = invoiceToday(now);
      const year = Number(issueDate.slice(0, 4));
      // The sandbox never touches the real counter: its credit notes are not real ones.
      const number =
        mode.kind === "live"
          ? await takeDocumentNumber(db, "credit_note", CREDIT_NOTE_PREFIX, year)
          : sandboxInvoiceNumber(CREDIT_NOTE_PREFIX, year, now);
      const reason = creditNoteReason(current.number, docLocale);

      await markOrderCheck(db, account.id, number, now);
      progress.qontoCalled = true;
      const issued = await createCreditNote(mode.qonto, {
        invoiceId: current.qontoInvoiceId,
        number,
        issueDate,
        reason,
        items: [creditNoteLine(current, docLocale)],
      });
      const qontoCreditNoteId = issued.ok ? issued.data.credit_note?.id : undefined;
      if (!qontoCreditNoteId) {
        // Only a real 4xx is Qonto refusing; anything else may have created the credit note.
        const refused =
          !issued.ok &&
          issued.status !== null &&
          issued.status >= 400 &&
          issued.status < 500;
        if (refused) {
          console.error(
            `[billing] credit note ${number} refused; the number stays unused`,
            issued,
          );
          await clearOrderCheck(tx, account.id);
          return failure("qonto", "Qonto did not issue the credit note.");
        }
        void alertOperators(`Unklar, ob ${number} ausgestellt wurde`, [
          `Qonto hat auf die Gutschrift ${number} zu ${current.number} nicht eindeutig geantwortet: ${issued.ok ? "kein id" : issued.error}.`,
          `Billing account ${account.id}. Bezahlt war die Rechnung: ${refundOwed ? "ja" : "nein"}.`,
          "In Qonto nachsehen. Gibt es die Gutschrift, die Zeile von Hand anlegen und den Zugang zurücksetzen; sonst die Kündigung neu auslösen lassen.",
          "Weitere Bestellungen und Kündigungen dieses Kontos sind gesperrt, bis die Prüfung im Pricing Tab aufgehoben wird.",
        ]);
        return failure("qonto_unknown", "Qonto did not answer clearly.");
      }

      try {
        await tx.insert(creditNote).values({
          invoiceId: current.id,
          qontoCreditNoteId,
          number,
          reason,
          refundOwed,
          createdByUserId: input.userId,
        });
        await tx
          .update(billingAccount)
          .set({ accessLevel: level, updatedAt: now })
          .where(eq(billingAccount.id, account.id));
        await clearOrderCheck(tx, account.id);
        return {
          ok: true,
          number,
          issueDate,
          qontoCreditNoteId,
          clientEmail: issued.ok ? issued.data.credit_note?.client?.email : undefined,
          level,
        } as const;
      } catch (err) {
        void alertOperators(`${number} ausgestellt, aber nicht erfasst`, [
          `Qonto hat die Gutschrift ${number} (${qontoCreditNoteId}) zu ${current.number} ausgestellt, der Eintrag bei uns ist fehlgeschlagen.`,
          `Billing account ${account.id}. Bezahlt war die Rechnung: ${refundOwed ? "ja, Erstattung offen" : "nein"}.`,
          `Fehler: ${err instanceof Error ? err.message : String(err)}`,
          "Die Zeile von Hand anlegen und den Zugang zurücksetzen.",
        ]);
        throw new AlreadyAlerted(err);
      }
    })
    .catch((err: unknown) => {
      if (!progress.qontoCalled) {
        console.error(
          `[billing] cancel for ${input.billingAccountId} failed before Qonto`,
          err,
        );
        return failure("qonto", "The cancel could not be made.");
      }
      if (!(err instanceof AlreadyAlerted)) {
        void alertOperators("Kündigung abgebrochen", [
          `Die Kündigung von ${current.number} (billing account ${input.billingAccountId}) ist nach der Anfrage an Qonto abgebrochen: ${err instanceof Error ? err.message : String(err)}.`,
          "In Qonto nachsehen, ob eine Gutschrift entstanden ist.",
          "Weitere Bestellungen und Kündigungen dieses Kontos sind gesperrt, bis die Prüfung im Pricing Tab aufgehoben wird.",
        ]);
      }
      return failure("qonto_unknown", "The cancel stopped part way.");
    });

  if (!outcome.ok) return unsent(outcome);

  // "Unpaid" only means Qonto has not matched a transfer yet. Customers pay by transfer, and a
  // credited invoice can never turn "paid" afterwards, so a transfer already on its way would go
  // unnoticed. A person watches for it; the Subscriptions tab lists these for ninety days.
  if (!refundOwed) {
    void alertOperators(`${current.number} gutgeschrieben, auf späte Zahlung achten`, [
      `Die Rechnung ${current.number} ist mit der Gutschrift ${outcome.number} storniert. Qonto meldete sie als unbezahlt.`,
      `In Qonto auf eine eingehende Überweisung mit ${current.number} im Verwendungszweck achten. Kommt eine, den Betrag zurücküberweisen und im Subscriptions Tab "Payment arrived, refund owed" setzen.`,
      `Billing account ${input.billingAccountId}.`,
    ]);
  } else {
    // The customer's email names the last day, so the person who makes the transfer hears it too.
    const amount = formatEuro(current.netCents + current.vatCents);
    const due = formatInvoiceDay(refundDueDay(outcome.issueDate), "de");
    void alertOperators(`Erstattung offen: ${amount} zu ${outcome.number}, bis ${due}`, [
      `Die Rechnung ${current.number} war bezahlt und ist mit der Gutschrift ${outcome.number} storniert.`,
      `${amount} bis ${due} in Qonto auf das Konto zurücküberweisen, von dem die Zahlung kam. So steht es in der E-Mail an den Kunden.`,
      `Danach im Subscriptions Tab "Mark refund done" klicken. Besteht sein Konto noch, bekommt der Kunde dann eine Bestätigung. Billing account ${input.billingAccountId}.`,
    ]);
  }

  const holder = await holderContact(db, input.userId);
  return {
    outcome: {
      ok: true,
      kind: "money_back",
      creditNoteNumber: outcome.number,
      refundOwed,
      accessLevel: outcome.level,
    },
    notice: holder
      ? {
          kind: "money_back",
          holder,
          accounting: accountingCopy(outcome.clientEmail, holder.email),
          creditNote: {
            qonto: mode.qonto,
            qontoCreditNoteId: outcome.qontoCreditNoteId,
            creditNoteNumber: outcome.number,
            creditNoteDate: outcome.issueDate,
            invoiceNumber: current.number,
            invoiceIssueDate: current.issueDate,
            amounts: { netCents: current.netCents, vatCents: current.vatCents },
            billingAccountId: input.billingAccountId,
            refundOwed,
          },
        }
      : null,
  };
};

const makeCancel = async (input: CancelInput): Promise<CancelMade> => {
  const now = input.now ?? new Date();
  const current = await currentInvoice(input.db, input.billingAccountId, now);
  if (!current) return unsent(failure("no_invoice", "Nothing to cancel."));
  const window = await cancelWindowFor(input.db, input.billingAccountId, current, now);
  return window.kind === "money_back"
    ? creditInvoice(input, current, now)
    : cancelRenewal(input, current, window.reason, now);
};

/** The cancel the holder asks for under Billing: the confirmation goes out at once. */
export async function cancelSubscription(input: CancelInput): Promise<CancelOutcome> {
  const { outcome, notice } = await makeCancel(input);
  if (notice) await sendCancelNotice(notice);
  return outcome;
}

/**
 * The cancel made because the holder deletes their account (lib/gdpr/self-erasure). Nothing is
 * sent: the erasure confirmation carries the notice, or it goes out on its own if the erasure does
 * not happen.
 */
export async function cancelForErasure(input: CancelInput): Promise<CancelMade> {
  return makeCancel(input);
}
