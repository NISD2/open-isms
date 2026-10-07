/**
 * Reissue: replace the invoice paying for an account with one whose terms a platform admin set,
 * typically a service period agreed with the customer after they ordered ("paid year runs to the
 * end of next year"). An issued invoice cannot be edited, so the new one is issued and the old one
 * is credited in full, which is the correction German VAT law expects.
 *
 *   1. Everything that can refuse is decided first: the period, the amount, that the old invoice is
 *      still unpaid in Qonto (a paid one is reissued by hand, because its money has to be matched
 *      to the new invoice), and that the account has a Qonto client.
 *   2. Under the account lock and an `order_check` mark (./place-order's pattern), the new invoice
 *      is issued first and recorded with `replaces_invoice_id`, then the old one is credited. In
 *      that order, a refusal of the new invoice leaves nothing changed; a credit note that fails
 *      after it leaves two invoices, keeps the mark, and tells the operators which one to credit.
 *   3. The new invoice goes out by email with a line naming the one it replaces. The credit note is
 *      not mailed: the customer asked for the change, and the new invoice says what happened.
 *
 * Access does not change: the account stays full throughout. The thirty days money back carry
 * over, counted from the original order (cancel.ts originalInvoice), and so does the VAT
 * treatment, so neither is decided twice.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { billingAccount, creditNote, invoice } from "@/schema";
import { AlreadyAlerted, alertOperators } from "./alert";
import { CREDIT_NOTE_PREFIX, cancelWindowFor, currentInvoice } from "./cancel";
import { creditNoteLine } from "./cancel-terms";
import { deliverInvoice } from "./deliver-invoice";
import { takeDocumentNumber } from "./document-number";
import { pickPayableAccount } from "./iban";
import { sandboxInvoiceNumber } from "./invoice-number";
import {
  type InvoiceDates,
  invoiceDates,
  invoiceToday,
  invoiceWording,
  type Money,
  periodProblem,
} from "./order";
import { clearOrderCheck, hasOrderCheck, markOrderCheck } from "./order-check";
import type { OrderingMode } from "./ordering";
import { createCreditNote, createInvoice, getInvoice, listBankAccounts } from "./qonto";
import { treatmentOf } from "./vies";

export interface ReissueInput {
  readonly db: Database;
  readonly mode: Exclude<OrderingMode, { readonly kind: "off" }>;
  readonly billingAccountId: string;
  readonly adminUserId: string;
  readonly invoicePrefix: string;
  /** The new service period, ISO calendar days. */
  readonly periodStart: string;
  readonly periodEnd: string;
  /** A new net amount, or null to keep the old invoice's. */
  readonly netCents: number | null;
  /** The customer's Bestellnummer, printed on the new invoice. */
  readonly purchaseOrder: string | null;
  /** Who gets the new invoice by email. */
  readonly recipients: readonly string[];
  readonly now?: Date;
}

export type ReissueOutcome =
  | {
      readonly ok: true;
      readonly number: string;
      readonly creditNoteNumber: string;
      readonly replacedNumber: string;
      readonly periodStart: string;
      readonly periodEnd: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | "no_invoice"
        | "invalid_period"
        /** The old invoice is paid, or not plainly unpaid, in Qonto: reissue it by hand. */
        | "not_unpaid"
        | "no_client"
        | "pending"
        | "qonto"
        | "qonto_unknown";
      readonly message: string;
    };

const failure = (
  reason: Extract<ReissueOutcome, { ok: false }>["reason"],
  message: string,
) => ({ ok: false, reason, message }) as const;

export async function reissueInvoice(input: ReissueInput): Promise<ReissueOutcome> {
  const { db, mode } = input;
  const now = input.now ?? new Date();
  const today = invoiceToday(now);

  const problem = periodProblem(input.periodStart, input.periodEnd, today);
  if (problem) return failure("invalid_period", problem);

  const old = await currentInvoice(db, input.billingAccountId, now);
  if (!old) return failure("no_invoice", "No running, uncredited invoice to reissue.");

  const live = await getInvoice(mode.qonto, old.qontoInvoiceId);
  const status = live.ok ? live.data.client_invoice?.status : undefined;
  if (status === undefined) return failure("qonto", "Qonto could not be read.");
  if (status !== "unpaid") {
    return failure(
      "not_unpaid",
      `${old.number} is ${status} in Qonto. Only an unpaid invoice is reissued here.`,
    );
  }

  const accounts = await listBankAccounts(mode.qonto);
  const iban = accounts.ok
    ? pickPayableAccount(accounts.data.bank_accounts ?? [])?.iban
    : undefined;
  if (!iban) return failure("qonto", "No Qonto account with a payable IBAN.");

  // The old invoice's VAT treatment and rate, applied to the new amount.
  const treatment = treatmentOf(old.vatTreatment);
  const netCents = input.netCents ?? old.netCents;
  const vatCents = Math.round(netCents * treatment.rate);
  const money: Money = {
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
    vatRate: treatment.rate,
    treatment,
  };
  const locale = old.vatTreatment === "domestic" ? "de" : "en";
  const dates: InvoiceDates = {
    ...invoiceDates(now),
    performanceStartDate: input.periodStart,
    performanceEndDate: input.periodEnd,
  };
  // The replacement keeps the money back of the order it replaces.
  const window = await cancelWindowFor(db, input.billingAccountId, old, now);
  const firstOrder = !(
    window.kind === "renewal" && window.reason === "not_first_invoice"
  );

  const progress = { qontoCalled: false };
  const outcome = await db
    .transaction(async (tx) => {
      const [account] = await tx
        .select({ id: billingAccount.id, qontoClientId: billingAccount.qontoClientId })
        .from(billingAccount)
        .where(eq(billingAccount.id, input.billingAccountId))
        .for("no key update");
      if (!account) return failure("no_invoice", "No billing account.");
      if (!account.qontoClientId) {
        return failure("no_client", "The account has no Qonto client.");
      }
      if (await hasOrderCheck(tx, account.id)) {
        return failure("pending", "An earlier order or cancel is still being checked.");
      }
      const [credited] = await tx
        .select({ id: creditNote.id })
        .from(creditNote)
        .where(eq(creditNote.invoiceId, old.id))
        .limit(1);
      if (credited) return failure("no_invoice", `${old.number} is already credited.`);

      const year = Number(dates.issueDate.slice(0, 4));
      const number =
        mode.kind === "live"
          ? await takeDocumentNumber(db, "invoice", input.invoicePrefix, year)
          : sandboxInvoiceNumber(input.invoicePrefix, year, now);
      const creditNumber =
        mode.kind === "live"
          ? await takeDocumentNumber(db, "credit_note", CREDIT_NOTE_PREFIX, year)
          : sandboxInvoiceNumber(CREDIT_NOTE_PREFIX, year, now);
      const wording = invoiceWording(dates, money, locale, firstOrder, old.number);

      await markOrderCheck(db, account.id, number, now);
      progress.qontoCalled = true;
      const issued = await createInvoice(mode.qonto, {
        clientId: account.qontoClientId,
        number,
        iban,
        issueDate: dates.issueDate,
        dueDate: dates.dueDate,
        performanceStartDate: dates.performanceStartDate,
        performanceEndDate: dates.performanceEndDate,
        ...(input.purchaseOrder ? { purchaseOrder: input.purchaseOrder } : {}),
        termsAndConditions: wording.footer,
        items: [
          {
            title: wording.title,
            description: wording.description,
            quantity: "1",
            unit: "unit",
            unitPrice: { value: (netCents / 100).toFixed(2), currency: "EUR" },
            vatRate: treatment.rate.toFixed(2),
          },
        ],
      });
      const qontoInvoiceId = issued.ok ? issued.data.client_invoice?.id : undefined;
      if (!qontoInvoiceId) {
        const refused =
          !issued.ok &&
          issued.status !== null &&
          issued.status >= 400 &&
          issued.status < 500;
        if (refused) {
          console.error(
            `[billing] reissue ${number} refused; the number stays unused`,
            issued,
          );
          await clearOrderCheck(tx, account.id);
          return failure(
            "qonto",
            "Qonto did not issue the new invoice. Nothing changed.",
          );
        }
        void alertOperators(`Unklar, ob ${number} ausgestellt wurde`, [
          `Neuausstellung von ${old.number}: Qonto hat auf die neue Rechnung ${number} nicht eindeutig geantwortet.`,
          `Billing account ${account.id}. ${old.number} ist noch nicht gutgeschrieben.`,
          "In Qonto nachsehen. Gibt es die neue Rechnung, die Zeile von Hand anlegen und die alte gutschreiben.",
          "Weitere Bestellungen dieses Kontos sind gesperrt, bis die Prüfung im Pricing Tab aufgehoben wird.",
        ]);
        return failure("qonto_unknown", "Qonto did not answer clearly.");
      }

      // Set once Qonto has issued the credit note, so a failure after it says so.
      let creditIssued: string | undefined;
      try {
        const [row] = await tx
          .insert(invoice)
          .values({
            billingAccountId: account.id,
            qontoInvoiceId,
            number,
            netCents,
            vatCents,
            vatTreatment: old.vatTreatment,
            viesRequestIdentifier: old.viesRequestIdentifier,
            issueDate: dates.issueDate,
            periodStart: dates.performanceStartDate,
            periodEnd: dates.performanceEndDate,
            source: "admin",
            createdByUserId: input.adminUserId,
            termsVersion: old.termsVersion,
            termsAcceptedAt: old.termsAcceptedAt,
            termsAcceptedByUserId: old.termsAcceptedByUserId,
            replacesInvoiceId: old.id,
          })
          .returning({ id: invoice.id });
        if (!row) throw new Error("invoice insert returned no row");

        const reason =
          locale === "de"
            ? `Storno der Rechnung ${old.number}: ersetzt durch Rechnung ${number}.`
            : `Cancellation of invoice ${old.number}: replaced by invoice ${number}.`;
        const credit = await createCreditNote(mode.qonto, {
          invoiceId: old.qontoInvoiceId,
          number: creditNumber,
          issueDate: dates.issueDate,
          reason,
          items: [creditNoteLine(old, locale)],
        });
        const qontoCreditNoteId = credit.ok ? credit.data.credit_note?.id : undefined;
        creditIssued = qontoCreditNoteId;
        if (!qontoCreditNoteId) {
          // The new invoice stands and is recorded; the old one is still open. The mark stays, so
          // nothing else happens on this account until a person has credited it.
          void alertOperators(`${old.number} nicht gutgeschrieben, ${number} steht`, [
            `Neuausstellung: ${number} ist ausgestellt und erfasst, die Gutschrift ${creditNumber} zu ${old.number} ist fehlgeschlagen: ${credit.ok ? "kein id" : credit.error}.`,
            `Billing account ${account.id}. ${old.number} in Qonto von Hand gutschreiben und die credit_note Zeile nachtragen; die neue Rechnung ist noch nicht verschickt.`,
            "Weitere Bestellungen dieses Kontos sind gesperrt, bis die Prüfung im Pricing Tab aufgehoben wird.",
          ]);
          return {
            ok: true,
            complete: false,
            number,
            rowId: row.id,
            qontoInvoiceId,
          } as const;
        }
        await tx.insert(creditNote).values({
          invoiceId: old.id,
          qontoCreditNoteId,
          number: creditNumber,
          reason,
          refundOwed: false,
          createdByUserId: input.adminUserId,
        });
        await tx
          .update(billingAccount)
          .set({ accessLevel: "full", updatedAt: now })
          .where(eq(billingAccount.id, account.id));
        await clearOrderCheck(tx, account.id);
        return {
          ok: true,
          complete: true,
          number,
          creditNumber,
          rowId: row.id,
          qontoInvoiceId,
        } as const;
      } catch (err) {
        void alertOperators(`${number} ausgestellt, aber nicht erfasst`, [
          `Neuausstellung von ${old.number}: Qonto hat ${number} (${qontoInvoiceId}) ausgestellt, der Eintrag bei uns ist fehlgeschlagen.`,
          creditIssued
            ? `Billing account ${account.id}. Auch die Gutschrift ${creditNumber} (${creditIssued}) zu ${old.number} ist in Qonto ausgestellt. Beide Zeilen von Hand anlegen.`
            : `Billing account ${account.id}. In Qonto nachsehen, ob ${old.number} gutgeschrieben ist.`,
          `Fehler: ${err instanceof Error ? err.message : String(err)}`,
        ]);
        throw new AlreadyAlerted(err);
      }
    })
    .catch((err: unknown) => {
      if (!progress.qontoCalled) {
        console.error(
          `[billing] reissue for ${input.billingAccountId} failed before Qonto`,
          err,
        );
        return failure("qonto", "The reissue could not be made. Nothing changed.");
      }
      if (!(err instanceof AlreadyAlerted)) {
        void alertOperators("Neuausstellung abgebrochen", [
          `Die Neuausstellung von ${old.number} (billing account ${input.billingAccountId}) ist nach der Anfrage an Qonto abgebrochen: ${err instanceof Error ? err.message : String(err)}.`,
          "In Qonto nachsehen, ob eine neue Rechnung oder eine Gutschrift entstanden ist.",
        ]);
      }
      return failure("qonto_unknown", "The reissue stopped part way.");
    });

  if (!outcome.ok) return outcome;
  if (!outcome.complete) {
    return failure(
      "qonto_unknown",
      `${outcome.number} was issued, but ${old.number} could not be credited. The operators were told; nothing was sent to the customer.`,
    );
  }

  deliverInvoice({
    db,
    qonto: mode.qonto,
    invoiceRowId: outcome.rowId,
    qontoInvoiceId: outcome.qontoInvoiceId,
    number: outcome.number,
    billingAccountId: input.billingAccountId,
    recipients: input.recipients,
    locale,
    termsVersion: old.termsVersion,
    amounts: money,
    dates,
    firstOrder,
    replacesNumber: old.number,
  }).catch((err) =>
    alertOperators(`${outcome.number} nicht zugestellt`, [
      `Die Zustellung der neu ausgestellten Rechnung ${outcome.number} ist abgebrochen: ${err instanceof Error ? err.message : String(err)}.`,
      "Aus Qonto von Hand senden.",
    ]),
  );

  return {
    ok: true,
    number: outcome.number,
    creditNoteNumber: outcome.creditNumber,
    replacedNumber: old.number,
    periodStart: dates.performanceStartDate,
    periodEnd: dates.performanceEndDate,
  };
}
