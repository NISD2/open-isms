/**
 * Cancel: the one function that ends a paid year, for the account holder only (billing.cancel).
 *
 *   - Inside the thirty days (./cancel-terms): a full credit note in Qonto, which cancels the
 *     invoice whether it was paid or not. Our credit_note row is written, the account falls back
 *     to the level it has without payment (./access unpaidAccessLevel), and if the invoice had been
 *     paid the refund is marked owed: a credit note moves no money, and our key cannot send a
 *     transfer, so a person makes it in Qonto and records it in the Subscriptions tab.
 *   - After them: `renewal_canceled_at` is set and access runs to the end of the paid year.
 *
 * The credit note follows the order's safety pattern (./place-order): everything that can refuse
 * is decided before Qonto is called, the number is committed before the call, the account is
 * locked, and an `order_check` mark is committed just before the call and removed once Qonto has
 * answered clearly. An unclear answer leaves the mark, which blocks further orders and cancels for
 * the account until a platform admin has checked Qonto, and the operators are told.
 */
import "@/lib/server-guard";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database, DbOrTx } from "@/lib/db";
import { invoiceEmail, sendMail } from "@/lib/mail";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { billingAccount, creditNote, invoice, user } from "@/schema";
import { unpaidAccessLevel } from "./access";
import type { AccessLevel } from "./accounts";
import { AlreadyAlerted, alertOperators } from "./alert";
import {
  canceledEmailWording,
  cancelWindow,
  creditNoteLine,
  creditNoteReason,
} from "./cancel-terms";
import { deliverCreditNote } from "./deliver-credit-note";
import { takeDocumentNumber } from "./document-number";
import { isGrandfatheredHolder } from "./holder-price";
import { sandboxInvoiceNumber } from "./invoice-number";
import { invoiceToday } from "./order";
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

const failure = (
  reason: Extract<CancelOutcome, { ok: false }>["reason"],
  message: string,
) => ({ ok: false, reason, message }) as const;

/** The invoice paying for the account right now, with the facts a credit note mirrors. */
const currentInvoice = async (db: DbOrTx, billingAccountId: string, now: Date) => {
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
      issueDate: invoice.issueDate,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
    })
    .from(invoice)
    .where(and(eq(invoice.id, active.id), eq(invoice.billingAccountId, billingAccountId)))
    .limit(1);
  return row ?? null;
};

type CurrentInvoice = NonNullable<Awaited<ReturnType<typeof currentInvoice>>>;

/** Where the confirmation goes, and in which language: the holder, as they read the platform. */
const holderContact = async (db: DbOrTx, userId: string) => {
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
  now: Date,
): Promise<CancelOutcome> => {
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
    return failure("pending", "An earlier order or cancel is still being checked.");
  }
  const alreadyCanceled = marked.length === 0;
  if (!alreadyCanceled) {
    const contact = await holderContact(input.db, input.userId);
    if (contact) {
      const wording = canceledEmailWording(
        { kind: "renewal", invoiceNumber: current.number, periodEnd: current.periodEnd },
        contact.locale,
      );
      const sent = await sendMail({
        emailType: "billing.canceled",
        to: contact.email,
        ...invoiceEmail({ ...wording, invoiceUrl: null }),
        idempotencyKey: `renewal-canceled-${input.billingAccountId}-${current.periodEnd}`,
      }).catch(() => ({ success: false }));
      if (!sent.success) {
        await alertOperators("Kündigungsbestätigung nicht zugestellt", [
          `Die Verlängerung für billing account ${input.billingAccountId} ist gekündigt, die Bestätigung an ${contact.email} ging aber nicht raus.`,
          `Zugang bis ${current.periodEnd}, Rechnung ${current.number}. Von Hand bestätigen.`,
        ]);
      }
    }
  }
  return { ok: true, kind: "renewal", periodEnd: current.periodEnd, alreadyCanceled };
};

/** The client email Qonto answered with, when it really is an address and not the holder's. */
const accountingCopy = (candidate: string | null | undefined, holder: string) =>
  candidate &&
  z.email().safeParse(candidate).success &&
  candidate.toLowerCase() !== holder.toLowerCase()
    ? [candidate]
    : [];

const creditInvoice = async (
  input: CancelInput,
  current: CurrentInvoice,
  now: Date,
): Promise<CancelOutcome> => {
  const { db, mode } = input;

  // Whether it was paid decides whether money is owed back, and the credit note makes Qonto's
  // status "canceled" for good, so it is read now, before anything is issued.
  const live = await getInvoice(mode.qonto, current.qontoInvoiceId);
  const status = live.ok ? live.data.client_invoice?.status : undefined;
  if (status !== "paid" && status !== "unpaid") {
    if (status === undefined) {
      return failure("qonto", "Qonto could not be read. Nothing was canceled.");
    }
    void alertOperators(`${current.number} ist in Qonto ${status}`, [
      `Der Kunde will ${current.number} innerhalb der 30 Tage kündigen. Bei uns ist die Rechnung aktiv, in Qonto hat sie den Status ${status}.`,
      `Billing account ${input.billingAccountId}. In Qonto nachsehen, die Gutschrift von Hand anlegen oder die Zeile nachtragen, und den Zugang von Hand setzen.`,
    ]);
    return failure("qonto_unknown", `Qonto reports the invoice as ${status}.`);
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

  if (!outcome.ok) return outcome;

  // "Unpaid" only means Qonto has not matched a transfer yet. Customers pay by transfer, and a
  // credited invoice can never turn "paid" afterwards, so a transfer already on its way would go
  // unnoticed. A person watches for it; the Subscriptions tab lists these for ninety days.
  if (!refundOwed) {
    void alertOperators(`${current.number} gutgeschrieben, auf späte Zahlung achten`, [
      `Die Rechnung ${current.number} ist mit der Gutschrift ${outcome.number} storniert. Qonto meldete sie als unbezahlt.`,
      `In Qonto auf eine eingehende Überweisung mit ${current.number} im Verwendungszweck achten. Kommt eine, den Betrag zurücküberweisen und im Subscriptions Tab "Payment arrived, refund owed" setzen.`,
      `Billing account ${input.billingAccountId}.`,
    ]);
  }

  const contact = await holderContact(db, input.userId);
  if (contact) {
    deliverCreditNote({
      qonto: mode.qonto,
      qontoCreditNoteId: outcome.qontoCreditNoteId,
      creditNoteNumber: outcome.number,
      invoiceNumber: current.number,
      billingAccountId: input.billingAccountId,
      refundOwed,
      recipients: [contact.email, ...accountingCopy(outcome.clientEmail, contact.email)],
      locale: contact.locale,
    }).catch((err: unknown) =>
      alertOperators(`${outcome.number} nicht zugestellt`, [
        `Die Zustellung der Gutschrift ${outcome.number} ist abgebrochen: ${err instanceof Error ? err.message : String(err)}.`,
        "Aus Qonto von Hand senden.",
      ]),
    );
  }

  return {
    ok: true,
    kind: "money_back",
    creditNoteNumber: outcome.number,
    refundOwed,
    accessLevel: outcome.level,
  };
};

export async function cancelSubscription(input: CancelInput): Promise<CancelOutcome> {
  const now = input.now ?? new Date();
  const current = await currentInvoice(input.db, input.billingAccountId, now);
  if (!current) return failure("no_invoice", "Nothing to cancel.");
  return cancelWindow(current.issueDate, now).kind === "money_back"
    ? creditInvoice(input, current, now)
    : cancelRenewal(input, current, now);
}
