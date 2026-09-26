/**
 * The arithmetic and the wording of a cancel, kept apart from the database and from Qonto so they
 * can be tested without either.
 */

import { invoiceToday, licenceTitle, shiftDay } from "./order";
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

export type EmailLocale = "de" | "en" | "nl";

const dayFormat = (iso: string, locale: EmailLocale) =>
  new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "nl" ? "nl-NL" : "en-GB",
    { dateStyle: "long", timeZone: "UTC" },
  ).format(new Date(`${iso}T12:00:00Z`));

export type CanceledEmail =
  | {
      readonly kind: "money_back";
      readonly invoiceNumber: string;
      readonly creditNoteNumber: string;
      readonly refundOwed: boolean;
      /** Whether the credit note PDF travels with the email. */
      readonly attached: boolean;
    }
  | {
      readonly kind: "renewal";
      readonly invoiceNumber: string;
      readonly periodEnd: string;
      readonly reason: Extract<CancelWindow, { kind: "renewal" }>["reason"];
    };

/** The confirmation a customer gets for either cancel, in their language. */
export const canceledEmailWording = (
  mail: CanceledEmail,
  locale: EmailLocale,
): { readonly subject: string; readonly paragraphs: readonly string[] } => {
  if (mail.kind === "renewal") {
    const end = dayFormat(mail.periodEnd, locale);
    const inv = mail.invoiceNumber;
    const firstOnly = mail.reason === "not_first_invoice";
    switch (locale) {
      case "de":
        return {
          subject: `Kündigung bestätigt: Ihre Lizenz läuft am ${end} aus`,
          paragraphs: [
            "Guten Tag,",
            "Sie haben die Jahreslizenz NIS 2 Durchgang gekündigt. Sie wird nicht verlängert.",
            `Ihr Zugang bleibt bis zum Ende des bezahlten Jahres am ${end} bestehen. ${firstOnly ? "Die 30 Tage Geld zurück gelten nur für die erste Bestellung eines Kontos" : "Die 30 Tage Geld zurück sind vorbei"}, deshalb bleibt die Rechnung ${inv} gültig. Ist sie noch offen, zahlen Sie sie bitte wie vereinbart.`,
            "Ihre Organisationen und alles, was Sie eingetragen haben, bleiben in Ihrem Konto erhalten.",
            "Mit freundlichen Grüßen",
            "nisd2.eu",
          ],
        };
      case "nl":
        return {
          subject: `Opzegging bevestigd: uw licentie loopt af op ${end}`,
          paragraphs: [
            "Goedendag,",
            "U heeft de jaarlicentie NIS 2 begeleide doorloop opgezegd. Deze wordt niet verlengd.",
            `Uw toegang blijft tot het einde van het betaalde jaar op ${end} bestaan. ${firstOnly ? "De 30 dagen geld terug gelden alleen voor de eerste bestelling van een account" : "De 30 dagen geld terug zijn voorbij"}, daarom blijft factuur ${inv} geldig. Staat die nog open, betaal deze dan zoals afgesproken.`,
            "Uw organisaties en alles wat u heeft ingevoerd, blijven in uw account bewaard.",
            "Met vriendelijke groet",
            "nisd2.eu",
          ],
        };
      default:
        return {
          subject: `Cancellation confirmed: your licence ends on ${end}`,
          paragraphs: [
            "Hello,",
            "You have canceled the NIS 2 guided pass annual licence. It will not renew.",
            `Your access stays open until the end of the paid year on ${end}. ${firstOnly ? "The thirty days money back apply only to an account's first order" : "The thirty days money back have passed"}, so invoice ${inv} stands. If it is still open, please pay it as agreed.`,
            "Your organizations and everything you entered stay in your account.",
            "Kind regards",
            "nisd2.eu",
          ],
        };
    }
  }

  const { invoiceNumber: inv, creditNoteNumber: cn, refundOwed, attached } = mail;
  switch (locale) {
    case "de":
      return {
        subject: `Gutschrift ${cn}: Ihre Bestellung ist storniert`,
        paragraphs: [
          "Guten Tag,",
          `Sie haben die Jahreslizenz NIS 2 Durchgang innerhalb der 30 Tage gekündigt. Die Rechnung ${inv} ist mit der Gutschrift ${cn} storniert${attached ? ", die Sie im Anhang finden" : ""}.`,
          refundOwed
            ? "Sie hatten die Rechnung schon bezahlt. Wir überweisen Ihnen den Betrag innerhalb von 30 Tagen nach der Kündigung zurück, auf das Konto, von dem Ihre Zahlung kam."
            : "Bei uns ist noch keine Zahlung eingegangen, und die Rechnung müssen Sie nicht mehr bezahlen. Haben Sie den Betrag schon überwiesen, erstatten wir ihn innerhalb von 30 Tagen nach ihrem Eingang.",
          "Ihre Organisationen und alles, was Sie eingetragen haben, bleiben in Ihrem Konto erhalten.",
          "Mit freundlichen Grüßen",
          "nisd2.eu",
        ],
      };
    case "nl":
      return {
        subject: `Creditnota ${cn}: uw bestelling is geannuleerd`,
        paragraphs: [
          "Goedendag,",
          `U heeft de jaarlicentie NIS 2 begeleide doorloop binnen de 30 dagen opgezegd. Factuur ${inv} is geannuleerd met creditnota ${cn}${attached ? ", die u in de bijlage vindt" : ""}.`,
          refundOwed
            ? "U had de factuur al betaald. Wij maken het bedrag binnen 30 dagen na de opzegging terug over naar de rekening waarvan uw betaling kwam."
            : "Bij ons is nog geen betaling binnengekomen, en de factuur hoeft u niet meer te betalen. Heeft u het bedrag al overgemaakt, dan betalen wij het binnen 30 dagen na ontvangst terug.",
          "Uw organisaties en alles wat u heeft ingevoerd, blijven in uw account bewaard.",
          "Met vriendelijke groet",
          "nisd2.eu",
        ],
      };
    default:
      return {
        subject: `Credit note ${cn}: your order is canceled`,
        paragraphs: [
          "Hello,",
          `You canceled the NIS 2 guided pass annual licence within the thirty days. Invoice ${inv} is canceled by credit note ${cn}${attached ? ", attached to this email" : ""}.`,
          refundOwed
            ? "You had already paid the invoice. We will transfer the amount back within 30 days of the cancellation, to the account your payment came from."
            : "No payment has reached us yet, and you no longer need to pay the invoice. If you have already transferred the amount, we refund it within 30 days of its arrival.",
          "Your organizations and everything you entered stay in your account.",
          "Kind regards",
          "nisd2.eu",
        ],
      };
  }
};
