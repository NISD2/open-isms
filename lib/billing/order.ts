/**
 * The order itself: what is asked for, what it costs, and what the invoice says.
 *
 * Kept separate from the Qonto client and from the VAT check so the arithmetic and the wording can
 * be tested without a network, which is most of what can go wrong on an invoice.
 */
import { z } from "zod";
import { checkStructure } from "./vat-checksum";
import { type VatCheck, type VatTreatment, vatTreatment } from "./vies";

/** 4.800 net a year, the single offer. Cents, because money is never a float. */
export const ANNUAL_NET_CENTS = 480_000;

/**
 * What the billing step collects. Every field here is on the invoice or decides the tax on it;
 * nothing is asked for curiosity.
 *
 * The VAT number is required because the offer is to businesses only, and because the country in it
 * decides the tax treatment. The offline check digit is part of the
 * schema rather than a separate step, so a typo is caught by the same validation that catches an
 * empty field.
 */
export const orderSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "The company's registered name is needed for the invoice."),
  street: z.string().trim().min(2, "Street and number."),
  zip: z.string().trim().min(3, "Postcode."),
  city: z.string().trim().min(2, "City."),
  countryCode: z
    .string()
    .trim()
    .length(2, "Two-letter country code.")
    .transform((s) => s.toUpperCase()),
  vatNumber: z.string().trim().min(4, "VAT identification number."),
  /** Where the invoice is sent. Usually not the person ordering: it goes to Buchhaltung. */
  invoiceEmail: z.email("An address the invoice can be sent to."),
  /** So the person who ordered can see what their accounting received. */
  copyToEmail: z.union([z.email(), z.literal("")]).optional(),
  /** Their own Bestellnummer or Kostenstelle. Many companies will not pay without it. */
  purchaseOrder: z.string().trim().max(120).optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

/** Adds the offline check digit to the schema's own validation, so both surface the same way. */
export const orderSchemaWithVatCheck = orderSchema.superRefine((v, ctx) => {
  const compact = v.vatNumber.replace(/[\s.\-/]/g, "").toUpperCase();
  const m = /^([A-Z]{2})([0-9A-Z]{2,14})$/.exec(compact);
  if (!m?.[1] || !m[2]) {
    ctx.addIssue({
      code: "custom",
      path: ["vatNumber"],
      message:
        "That does not look like a VAT identification number. It starts with a country code.",
    });
    return;
  }
  const r = checkStructure(m[1], m[2]);
  if (!r.ok) {
    ctx.addIssue({
      code: "custom",
      path: ["vatNumber"],
      message:
        r.reason === "checksum"
          ? "That number has a digit wrong somewhere. Check it against your tax office letter."
          : "That does not look like a VAT identification number for that country.",
    });
  }
});

export interface Money {
  readonly netCents: number;
  readonly vatCents: number;
  readonly grossCents: number;
  readonly vatRate: number;
  readonly treatment: VatTreatment;
}

/**
 * What they actually pay. The tax follows the VAT number: a German customer is invoiced with
 * German VAT, an EU business with a CONFIRMED number is reverse charged, and an EU number that
 * could not be confirmed carries domestic VAT, because the confirmation is what justifies zeroing
 * it. That last branch is the one that quietly costs money if it is got wrong.
 */
export const priceFor = (countryCode: string, check: VatCheck | null): Money => {
  const treatment = vatTreatment(
    countryCode,
    check ?? { status: "unavailable", reason: "not checked" },
  );
  const vatCents = Math.round(ANNUAL_NET_CENTS * treatment.rate);
  return {
    netCents: ANNUAL_NET_CENTS,
    vatCents,
    grossCents: ANNUAL_NET_CENTS + vatCents,
    vatRate: treatment.rate,
    treatment,
  };
};

export const formatEuro = (cents: number, locale = "de-DE"): string =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

/** ISO date, which is what the Qonto endpoint wants for issue, due and performance dates. */
const isoDate = (d: Date): string => {
  const s = d.toISOString();
  const day = s.slice(0, 10);
  if (!day) throw new Error("unreachable: ISO string is always at least 10 characters");
  return day;
};

export interface InvoiceDates {
  readonly issueDate: string;
  readonly dueDate: string;
  readonly performanceStartDate: string;
  readonly performanceEndDate: string;
}

/**
 * Dates for the invoice. Thirty days to pay, and the service period is the year that starts the
 * day they order, because access starts at order rather than at payment and the invoice should
 * describe the same thing the product does.
 */
export const invoiceDates = (orderedAt: Date, termDays = 30): InvoiceDates => {
  const due = new Date(orderedAt);
  due.setDate(due.getDate() + termDays);
  const end = new Date(orderedAt);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return {
    issueDate: isoDate(orderedAt),
    dueDate: isoDate(due),
    performanceStartDate: isoDate(orderedAt),
    performanceEndDate: isoDate(end),
  };
};

/**
 * The line item and the footer, in the customer's language.
 *
 * The footer carries two things that are not decoration: the reverse-charge wording where it
 * applies, which the invoice is legally required to state, and the instruction to quote the invoice
 * number as the payment reference, which is what makes the automatic payment match work at all.
 */
export const invoiceWording = (
  dates: InvoiceDates,
  money: Money,
  locale: "de" | "en",
): { readonly title: string; readonly description: string; readonly footer: string } => {
  const period =
    locale === "de"
      ? `Leistungszeitraum ${dates.performanceStartDate} bis ${dates.performanceEndDate}`
      : `Service period ${dates.performanceStartDate} to ${dates.performanceEndDate}`;

  const guarantee =
    locale === "de"
      ? "30 Tage Geld zurück ab Bestelldatum."
      : "Thirty days money back from the order date.";

  const reference =
    locale === "de"
      ? "Bitte geben Sie bei der Überweisung die Rechnungsnummer als Verwendungszweck an."
      : "Please quote the invoice number as the payment reference.";

  const taxNote =
    money.treatment.kind === "reverse_charge" || money.treatment.kind === "outside_eu"
      ? money.treatment.note
      : "";

  return {
    title:
      locale === "de"
        ? "NIS 2 Durchgang, Jahreslizenz"
        : "NIS 2 guided pass, annual licence",
    description: period,
    footer: [taxNote, guarantee, reference].filter(Boolean).join(" "),
  };
};

/**
 * The email the invoice travels in. Short, because the PDF carries everything that matters; the
 * two things repeated here are the ones a payer acts on without opening it: the term, and the
 * number to quote.
 */
export const invoiceEmailWording = (
  number: string,
  locale: "de" | "en",
): { readonly subject: string; readonly body: string } =>
  locale === "de"
    ? {
        subject: `Rechnung ${number}: NIS 2 Durchgang, Jahreslizenz`,
        body: [
          "Guten Tag,",
          `anbei erhalten Sie die Rechnung ${number} für die Jahreslizenz NIS 2 Durchgang.`,
          "Zahlbar innerhalb von 30 Tagen. Bitte geben Sie bei der Überweisung die Rechnungsnummer als Verwendungszweck an. 30 Tage Geld zurück ab Bestelldatum.",
          "Mit freundlichen Grüßen",
          "nisd2.eu",
        ].join("\n\n"),
      }
    : {
        subject: `Invoice ${number}: NIS 2 guided pass, annual licence`,
        body: [
          "Hello,",
          `please find attached invoice ${number} for the NIS 2 guided pass annual licence.`,
          "Payable within 30 days. Please quote the invoice number as the payment reference. Thirty days money back from the order date.",
          "Kind regards",
          "nisd2.eu",
        ].join("\n\n"),
      };
