/**
 * The order itself: what is asked for, what it costs, and what the invoice says.
 *
 * Kept separate from the Qonto client and from the VAT check so the arithmetic and the wording can
 * be tested without a network, which is most of what can go wrong on an invoice.
 */
import { z } from "zod";
import { termsVersionLabel } from "./terms";
import { checkStructure } from "./vat-checksum";
import { type VatCheck, type VatTreatment, vatTreatment } from "./vies";

/** 4.800 net a year, the single offer. Cents, because money is never a float. */
export const ANNUAL_NET_CENTS = 480_000;

/**
 * What a grandfathered person pays: half, on every order, renewal and re-order, including after
 * their account became full. Grandfathering belongs to the person (./access), so the price does too.
 */
export const GRANDFATHERED_NET_CENTS = 240_000;

/**
 * The yearly net price for whoever holds the account, decided on the server and never taken from a
 * browser. Whether the holder is grandfathered is decided by `holderNetCents` (./holder-price).
 */
export const netCentsFor = (holderGrandfathered: boolean): number =>
  holderGrandfathered ? GRANDFATHERED_NET_CENTS : ANNUAL_NET_CENTS;

/**
 * What the billing step collects. Every field here is on the invoice or decides the tax on it;
 * nothing is asked for curiosity.
 *
 * The VAT number is required because the offer is to businesses only, and because the country in it
 * decides the tax treatment. The offline check digit is part of the
 * schema rather than a separate step, so a typo is caught by the same validation that catches an
 * empty field.
 */
/**
 * The messages are codes, not sentences: the order form translates them (messages/billing,
 * `errors.<code>`), so a German customer is not corrected in English.
 */
export const orderSchema = z.object({
  companyName: z.string().trim().min(2, "companyName").max(255, "tooLong"),
  street: z.string().trim().min(2, "street").max(255, "tooLong"),
  zip: z.string().trim().min(3, "zip").max(20, "tooLong"),
  city: z.string().trim().min(2, "city").max(255, "tooLong"),
  countryCode: z
    .string()
    .trim()
    .length(2, "countryCode")
    .transform((s) => s.toUpperCase()),
  vatNumber: z.string().trim().min(4, "vatFormat"),
  /** Where the invoice is sent. Usually not the person ordering: it goes to Buchhaltung. */
  invoiceEmail: z.email("email"),
  /** So the person who ordered can see what their accounting received. */
  copyToEmail: z.union([z.email("email"), z.literal("")]).optional(),
  /** Their own Bestellnummer or Kostenstelle. Many companies will not pay without it. */
  purchaseOrder: z.string().trim().max(120, "tooLong").optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

/** Adds the offline check digit to the schema's own validation, so both surface the same way. */
export const orderSchemaWithVatCheck = orderSchema.superRefine((v, ctx) => {
  const compact = v.vatNumber.replace(/[\s.\-/]/g, "").toUpperCase();
  const m = /^([A-Z]{2})([0-9A-Z]{2,14})$/.exec(compact);
  if (!m?.[1] || !m[2]) {
    ctx.addIssue({ code: "custom", path: ["vatNumber"], message: "vatFormat" });
    return;
  }
  const r = checkStructure(m[1], m[2]);
  if (!r.ok) {
    ctx.addIssue({
      code: "custom",
      path: ["vatNumber"],
      message: r.reason === "checksum" ? "vatChecksum" : "vatCountry",
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
export const priceFor = (
  countryCode: string,
  check: VatCheck | null,
  netCents: number,
): Money => {
  const treatment = vatTreatment(
    countryCode,
    check ?? { status: "unavailable", reason: "not checked" },
  );
  const vatCents = Math.round(netCents * treatment.rate);
  return {
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
    vatRate: treatment.rate,
    treatment,
  };
};

export const formatEuro = (cents: number, locale = "de-DE"): string =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

/**
 * The time zone invoice dates are counted in: the seller's. An invoice's issue date is a calendar
 * day where the seller is, not wherever the server's clock happens to be, so an order at 00:30 in
 * Berlin is dated that day even on a server running in UTC.
 */
export const INVOICE_TIME_ZONE = "Europe/Berlin";

/** The calendar day of an instant in a time zone, as `YYYY-MM-DD` (the en-CA format). */
const calendarDay = (instant: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

/** Today as a calendar day where invoices are dated. */
export const invoiceToday = (now: Date): string => calendarDay(now, INVOICE_TIME_ZONE);

/** Calendar arithmetic on `YYYY-MM-DD`, done in UTC so no time zone can shift the day. */
export const shiftDay = (
  day: string,
  change: { readonly days?: number; readonly years?: number },
) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + (change.years ?? 0));
  d.setUTCDate(d.getUTCDate() + (change.days ?? 0));
  return d.toISOString().slice(0, 10);
};

export interface InvoiceDates {
  readonly issueDate: string;
  readonly dueDate: string;
  readonly performanceStartDate: string;
  readonly performanceEndDate: string;
}

/**
 * Dates for the invoice, as ISO calendar days, which is what the Qonto endpoint wants. Thirty days
 * to pay, and the service period is the year that starts the day they order, because access starts
 * at order rather than at payment and the invoice should describe the same thing the product does.
 */
export const invoiceDates = (
  orderedAt: Date,
  termDays = 30,
  timeZone = INVOICE_TIME_ZONE,
): InvoiceDates => {
  const issueDate = calendarDay(orderedAt, timeZone);
  return {
    issueDate,
    dueDate: shiftDay(issueDate, { days: termDays }),
    performanceStartDate: issueDate,
    performanceEndDate: shiftDay(issueDate, { years: 1, days: -1 }),
  };
};

/** The line item's title, on the invoice and on the credit note that cancels it. */
export const licenceTitle = (locale: "de" | "en"): string =>
  locale === "de" ? "NIS 2 Durchgang, Jahreslizenz" : "NIS 2 guided pass, annual licence";

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
    title: licenceTitle(locale),
    description: period,
    footer: [taxNote, guarantee, reference].filter(Boolean).join(" "),
  };
};

/**
 * The email the invoice travels in. Short, because the PDF carries everything that matters; the
 * two things repeated here are the ones a payer acts on without opening it: the term, and the
 * number to quote.
 */
export const invoiceEmailWording = (opts: {
  readonly number: string;
  readonly locale: "de" | "en";
  /** Where the invoice is when the PDF could not be attached: Qonto's public invoice page. */
  readonly invoiceUrl: string | null;
  /** The AGB version the order accepted; the email names it when there is one. */
  readonly termsVersion: string | null;
}): { readonly subject: string; readonly paragraphs: readonly string[] } => {
  const { number, locale, invoiceUrl, termsVersion } = opts;
  const terms = termsVersion
    ? locale === "de"
      ? [
          `Es gelten unsere AGB in der Fassung vom ${termsVersionLabel("de", termsVersion)}.`,
        ]
      : [`Our terms as of ${termsVersionLabel("en", termsVersion)} apply.`]
    : [];
  return locale === "de"
    ? {
        subject: `Rechnung ${number}: NIS 2 Durchgang, Jahreslizenz`,
        paragraphs: [
          "Guten Tag,",
          invoiceUrl
            ? `die Rechnung ${number} für die Jahreslizenz NIS 2 Durchgang finden Sie hier: ${invoiceUrl}`
            : `anbei erhalten Sie die Rechnung ${number} für die Jahreslizenz NIS 2 Durchgang.`,
          "Zahlbar innerhalb von 30 Tagen. Bitte geben Sie bei der Überweisung die Rechnungsnummer als Verwendungszweck an. 30 Tage Geld zurück ab Bestelldatum.",
          ...terms,
          "Mit freundlichen Grüßen",
          "nisd2.eu",
        ],
      }
    : {
        subject: `Invoice ${number}: NIS 2 guided pass, annual licence`,
        paragraphs: [
          "Hello,",
          invoiceUrl
            ? `invoice ${number} for the NIS 2 guided pass annual licence is here: ${invoiceUrl}`
            : `please find attached invoice ${number} for the NIS 2 guided pass annual licence.`,
          "Payable within 30 days. Please quote the invoice number as the payment reference. Thirty days money back from the order date.",
          ...terms,
          "Kind regards",
          "nisd2.eu",
        ],
      };
};
