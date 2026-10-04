/**
 * The arithmetic and the wording of a cancel, kept apart from the database and from Qonto so they
 * can be tested without either.
 */

import type { EmailLocale } from "@/lib/mail/locale";
import type { DocumentEmail } from "@/lib/mail/templates";
import {
  amountFact,
  formatInvoiceDay,
  invoiceToday,
  licenceTitle,
  shiftDay,
} from "./order";
import type { InvoiceLine } from "./qonto";

/** Money back for thirty days from the order, the same thirty days the invoice gives to pay. */
export const MONEY_BACK_DAYS = 30;

export type CancelWindow =
  | {
      /** Inside the thirty days of the account's first invoice: a full credit note cancels it. */
      readonly kind: "money_back";
      /** Days since the issue date: 0 on the order day, 30 on the last day. */
      readonly day: number;
      readonly lastDay: string;
    }
  | {
      /** Otherwise: nothing is credited, the paid year runs out and does not renew. */
      readonly kind: "renewal";
      readonly day: number;
      /**
       * Why there is no money back: the thirty days have passed, or the invoice is not the
       * account's first (a renewal, or a new order after a cancel), which never has them (AGB B7).
       */
      readonly reason: "window_passed" | "not_first_invoice";
    };

const daysBetween = (from: string, to: string): number =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );

/**
 * Which cancel applies to an invoice today. Money back belongs to the account's first invoice
 * only. The order day does not count and the thirtieth day after it does (§ 187 Abs. 1, § 188
 * Abs. 1 BGB), so an order on the 1st can be canceled for its money until the end of the 31st, in
 * Berlin, where invoices are dated.
 */
export const cancelWindow = (
  inv: { readonly issueDate: string; readonly firstInvoice: boolean },
  now: Date,
): CancelWindow => {
  const lastDay = shiftDay(inv.issueDate, { days: MONEY_BACK_DAYS });
  const day = daysBetween(inv.issueDate, invoiceToday(now));
  if (!inv.firstInvoice) return { kind: "renewal", day, reason: "not_first_invoice" };
  return invoiceToday(now) <= lastDay
    ? { kind: "money_back", day, lastDay }
    : { kind: "renewal", day, reason: "window_passed" };
};

/** The facts of the invoice a credit note cancels, as our row keeps them. */
export interface CreditedInvoice {
  readonly number: string;
  readonly netCents: number;
  readonly vatCents: number;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/**
 * The credit note's one line: the invoice's line, for its whole amount. The rate comes from the
 * amounts the invoice was issued with, not from today's rules, so the credit note mirrors the
 * invoice even if a rate changed since.
 */
export const creditNoteLine = (
  inv: CreditedInvoice,
  locale: "de" | "en",
): InvoiceLine => ({
  title: licenceTitle(locale),
  description:
    locale === "de"
      ? `Leistungszeitraum ${inv.periodStart} bis ${inv.periodEnd}`
      : `Service period ${inv.periodStart} to ${inv.periodEnd}`,
  quantity: "1",
  unit: "unit",
  unitPrice: { value: (inv.netCents / 100).toFixed(2), currency: "EUR" },
  vatRate: (inv.vatCents / inv.netCents).toFixed(2),
});

/** Why the credit note exists, printed on it. */
export const creditNoteReason = (invoiceNumber: string, locale: "de" | "en"): string =>
  locale === "de"
    ? `Storno der Rechnung ${invoiceNumber}: Kündigung innerhalb der 30 Tage Geld zurück.`
    : `Cancellation of invoice ${invoiceNumber}: canceled within the thirty days money back.`;

/** Days to transfer money back after a cancel inside the thirty days, as the AGB promise. */
export const REFUND_DAYS = 30;

/** The last day a refund owed for a cancel on `cancelDay` may go out, as a Berlin calendar day. */
export const refundDueDay = (cancelDay: string): string =>
  shiftDay(cancelDay, { days: REFUND_DAYS });

const licenceName = (locale: EmailLocale): string =>
  locale === "nl" ? "NIS 2 begeleide doorloop, jaarlicentie" : licenceTitle(locale);

export type CanceledEmail = (
  | {
      readonly kind: "money_back";
      readonly invoiceNumber: string;
      readonly invoiceIssueDate: string;
      readonly creditNoteNumber: string;
      /** The credit note's issue date, which is the day of the cancel. */
      readonly creditNoteDate: string;
      readonly amounts: { readonly netCents: number; readonly vatCents: number };
      readonly refundOwed: boolean;
      /** Whether the credit note PDF travels with the email. */
      readonly attached: boolean;
    }
  | {
      readonly kind: "renewal";
      readonly invoiceNumber: string;
      readonly periodEnd: string;
      readonly reason: Extract<CancelWindow, { kind: "renewal" }>["reason"];
    }
) & {
  /**
   * The holder is deleting their account with this cancel, so nothing stays in it. They read the
   * cancel inside the erasure confirmation, and the accounting copy has no account to speak of, so
   * the line about the account is left out.
   */
  readonly accountErased?: boolean;
};

/** The line before the sign-off, while the account stays: what becomes of it. */
const ACCOUNT_KEPT: Record<EmailLocale, string> = {
  de: "Ihre Organisationen und alles, was Sie eingetragen haben, bleiben in Ihrem Konto erhalten.",
  nl: "Uw organisaties en alles wat u heeft ingevoerd, blijven in uw account bewaard.",
  en: "Your organizations and everything you entered stay in your account.",
};

const accountLine = (locale: EmailLocale, erased: boolean): readonly string[] =>
  erased ? [] : [ACCOUNT_KEPT[locale]];

const GREETING: Record<EmailLocale, string> = {
  de: "Guten Tag,",
  en: "Hello,",
  nl: "Goedendag,",
};

/** The confirmation of a cancel that only stops the renewal, in the holder's language. */
const renewalWording = (
  mail: Extract<CanceledEmail, { kind: "renewal" }>,
  locale: EmailLocale,
): DocumentEmail => {
  const erased = mail.accountErased === true;
  const account = accountLine(locale, erased);
  const end = formatInvoiceDay(mail.periodEnd, locale);
  const inv = mail.invoiceNumber;
  const firstOnly = mail.reason === "not_first_invoice";
  const common = { locale, greeting: GREETING[locale] } as const;
  switch (locale) {
    case "de":
      return {
        ...common,
        subject: `Kündigung bestätigt: Ihre Lizenz läuft am ${end} aus`,
        heading: "Ihre Kündigung ist bestätigt",
        intro: [
          "Sie haben die Jahreslizenz NIS 2 Durchgang gekündigt. Sie wird nicht verlängert.",
        ],
        document: {
          kind: "Kündigung",
          reference: licenceName(locale),
          facts: [
            erased
              ? { label: "Zugang", value: "Endet mit der Löschung Ihres Kontos" }
              : { label: "Zugang bis", value: end, emphasis: true },
            { label: "Verlängerung", value: "Keine" },
            { label: "Rechnung", value: inv, detail: "bleibt gültig" },
          ],
        },
        outro: [
          `${firstOnly ? "Die 30 Tage Geld zurück gelten nur für die erste Bestellung eines Kontos" : "Die 30 Tage Geld zurück sind vorbei"}, deshalb bleibt die Rechnung ${inv} gültig. Ist sie noch offen, zahlen Sie sie bitte wie vereinbart.`,
          ...account,
        ],
      };
    case "nl":
      return {
        ...common,
        subject: `Opzegging bevestigd: uw licentie loopt af op ${end}`,
        heading: "Uw opzegging is bevestigd",
        intro: [
          "U heeft de jaarlicentie NIS 2 begeleide doorloop opgezegd. Deze wordt niet verlengd.",
        ],
        document: {
          kind: "Opzegging",
          reference: licenceName(locale),
          facts: [
            erased
              ? { label: "Toegang", value: "Eindigt met de verwijdering van uw account" }
              : { label: "Toegang tot", value: end, emphasis: true },
            { label: "Verlenging", value: "Geen" },
            { label: "Factuur", value: inv, detail: "blijft geldig" },
          ],
        },
        outro: [
          `${firstOnly ? "De 30 dagen geld terug gelden alleen voor de eerste bestelling van een account" : "De 30 dagen geld terug zijn voorbij"}, daarom blijft factuur ${inv} geldig. Staat die nog open, betaal deze dan zoals afgesproken.`,
          ...account,
        ],
      };
    case "en":
      return {
        ...common,
        subject: `Cancellation confirmed: your licence ends on ${end}`,
        heading: "Your cancellation is confirmed",
        intro: [
          "You have canceled the annual licence for the NIS 2 walkthrough. It will not renew.",
        ],
        document: {
          kind: "Cancellation",
          reference: licenceName(locale),
          facts: [
            erased
              ? { label: "Access", value: "Ends with the deletion of your account" }
              : { label: "Access until", value: end, emphasis: true },
            { label: "Renewal", value: "None" },
            { label: "Invoice", value: inv, detail: "stands" },
          ],
        },
        outro: [
          `${firstOnly ? "The thirty days money back apply only to an account's first order" : "The thirty days money back have passed"}, so invoice ${inv} stands. If it is still open, please pay it as agreed.`,
          ...account,
        ],
      };
  }
};

/** The confirmation of a cancel inside the thirty days, with the credit note, in the holder's language. */
const moneyBackWording = (
  mail: Extract<CanceledEmail, { kind: "money_back" }>,
  locale: EmailLocale,
): DocumentEmail => {
  const erased = mail.accountErased === true;
  const account = accountLine(locale, erased);
  const day = (iso: string) => formatInvoiceDay(iso, locale);
  const {
    invoiceNumber: inv,
    creditNoteNumber: cn,
    refundOwed,
    attached,
    amounts,
  } = mail;
  const due = day(refundDueDay(mail.creditNoteDate));
  const reference = `${cn} · ${day(mail.creditNoteDate)}`;
  const common = { locale, greeting: GREETING[locale] } as const;
  switch (locale) {
    case "de":
      return {
        ...common,
        subject: `Gutschrift ${cn}: Ihre Bestellung ist storniert`,
        heading: "Ihre Bestellung ist storniert",
        intro: [
          `Sie haben die Jahreslizenz NIS 2 Durchgang innerhalb der 30 Tage gekündigt. Die Rechnung ist mit einer Gutschrift storniert${attached ? ", die Sie im Anhang finden" : ""}.`,
        ],
        document: {
          kind: "Gutschrift",
          reference,
          facts: [
            {
              label: "Storniert",
              value: `Rechnung ${inv} vom ${day(mail.invoiceIssueDate)}`,
            },
            { label: "Leistung", value: licenceName(locale) },
            amountFact("Betrag", amounts, locale),
            refundOwed
              ? {
                  label: "Rückzahlung",
                  value: `bis ${due}`,
                  detail: "auf das Konto, von dem Ihre Zahlung kam",
                  emphasis: true,
                }
              : {
                  label: "Zahlung",
                  value: "Nicht mehr nötig",
                  detail: "Die Rechnung ist storniert.",
                },
          ],
        },
        outro: [
          refundOwed
            ? `Sie hatten die Rechnung schon bezahlt.${erased ? "" : " Sobald der Betrag überwiesen ist, bestätigen wir es Ihnen in einer kurzen E-Mail."}`
            : "Bei uns ist noch keine Zahlung eingegangen. Haben Sie den Betrag schon überwiesen, erstatten wir ihn innerhalb von 30 Tagen nach seinem Eingang.",
          ...account,
        ],
      };
    case "nl":
      return {
        ...common,
        subject: `Creditnota ${cn}: uw bestelling is geannuleerd`,
        heading: "Uw bestelling is geannuleerd",
        intro: [
          `U heeft de jaarlicentie NIS 2 begeleide doorloop binnen de 30 dagen opgezegd. De factuur is geannuleerd met een creditnota${attached ? ", die u in de bijlage vindt" : ""}.`,
        ],
        document: {
          kind: "Creditnota",
          reference,
          facts: [
            {
              label: "Annuleert",
              value: `Factuur ${inv} van ${day(mail.invoiceIssueDate)}`,
            },
            { label: "Product", value: licenceName(locale) },
            amountFact("Bedrag", amounts, locale),
            refundOwed
              ? {
                  label: "Terugbetaling",
                  value: `uiterlijk ${due}`,
                  detail: "naar de rekening waarvan uw betaling kwam",
                  emphasis: true,
                }
              : {
                  label: "Betaling",
                  value: "Niet meer nodig",
                  detail: "De factuur is geannuleerd.",
                },
          ],
        },
        outro: [
          refundOwed
            ? `U had de factuur al betaald.${erased ? "" : " Zodra het bedrag is overgemaakt, bevestigen wij dat in een korte e-mail."}`
            : "Bij ons is nog geen betaling binnengekomen. Heeft u het bedrag al overgemaakt, dan betalen wij het binnen 30 dagen na ontvangst terug.",
          ...account,
        ],
      };
    case "en":
      return {
        ...common,
        subject: `Credit note ${cn}: your order is canceled`,
        heading: "Your order is canceled",
        intro: [
          `You canceled the annual licence for the NIS 2 walkthrough within the thirty days. The invoice is canceled by a credit note${attached ? ", attached as a PDF" : ""}.`,
        ],
        document: {
          kind: "Credit note",
          reference,
          facts: [
            {
              label: "Cancels",
              value: `Invoice ${inv} of ${day(mail.invoiceIssueDate)}`,
            },
            { label: "Item", value: licenceName(locale) },
            amountFact("Amount", amounts, locale),
            refundOwed
              ? {
                  label: "Refund",
                  value: `by ${due}`,
                  detail: "to the account your payment came from",
                  emphasis: true,
                }
              : {
                  label: "Payment",
                  value: "No longer needed",
                  detail: "The invoice is canceled.",
                },
          ],
        },
        outro: [
          refundOwed
            ? `You had already paid the invoice.${erased ? "" : " Once the amount is transferred, we confirm it in a short email."}`
            : "No payment has reached us yet. If you have already transferred the amount, we refund it within 30 days of its arrival.",
          ...account,
        ],
      };
  }
};

/** The confirmation a customer gets for either cancel, in their language. */
export const canceledEmailWording = (
  mail: CanceledEmail,
  locale: EmailLocale,
): DocumentEmail =>
  mail.kind === "renewal" ? renewalWording(mail, locale) : moneyBackWording(mail, locale);

/**
 * The note that a refund owed under a credit note has gone out, sent when an operator records the
 * transfer. It closes the promise the credit note email made.
 */
export const refundSentWording = (
  refund: {
    readonly creditNoteNumber: string;
    readonly invoiceNumber: string;
    readonly amounts: { readonly netCents: number; readonly vatCents: number };
  },
  locale: EmailLocale,
): DocumentEmail => {
  const { creditNoteNumber: cn, invoiceNumber: inv, amounts } = refund;
  const common = { locale, greeting: GREETING[locale], outro: [] } as const;
  switch (locale) {
    case "de":
      return {
        ...common,
        subject: `Erstattung zur Gutschrift ${cn}: Betrag überwiesen`,
        heading: "Der Betrag ist erstattet",
        intro: [
          "wie angekündigt haben wir Ihnen den Betrag der stornierten Rechnung zurücküberwiesen. Damit ist Ihre Bestellung vollständig abgewickelt.",
        ],
        document: {
          kind: "Erstattung zur Gutschrift",
          reference: cn,
          facts: [
            { label: "Storniert", value: `Rechnung ${inv}` },
            amountFact("Erstattet", amounts, locale),
            { label: "Überwiesen an", value: "das Konto, von dem Ihre Zahlung kam" },
          ],
        },
      };
    case "nl":
      return {
        ...common,
        subject: `Terugbetaling bij creditnota ${cn}: bedrag overgemaakt`,
        heading: "Het bedrag is terugbetaald",
        intro: [
          "Zoals aangekondigd hebben wij het bedrag van de geannuleerde factuur aan u teruggestort. Daarmee is uw bestelling volledig afgehandeld.",
        ],
        document: {
          kind: "Terugbetaling bij creditnota",
          reference: cn,
          facts: [
            { label: "Annuleert", value: `Factuur ${inv}` },
            amountFact("Terugbetaald", amounts, locale),
            { label: "Overgemaakt naar", value: "de rekening waarvan uw betaling kwam" },
          ],
        },
      };
    case "en":
      return {
        ...common,
        subject: `Refund for credit note ${cn}: amount transferred`,
        heading: "Your refund is complete",
        intro: [
          "As announced, we have transferred the amount of the canceled invoice back to you. This completes your order.",
        ],
        document: {
          kind: "Refund for credit note",
          reference: cn,
          facts: [
            { label: "Cancels", value: `Invoice ${inv}` },
            amountFact("Refunded", amounts, locale),
            { label: "Transferred to", value: "the account your payment came from" },
          ],
        },
      };
  }
};
