/**
 * Shared formatting utilities for PDF document rendering.
 */
import { clipAnswer } from "@/lib/compliance/intake-answers";
import { WALK_DATE_LOCALE } from "@/lib/durchgang/notes";
import { WALK_LOCALES, type WalkLocale } from "@/lib/durchgang/types";
import { exportLabels } from "./export-labels";

/**
 * The languages the export, report and policy documents ship in: the walk's, because the walk
 * writes what they print.
 *
 * This used to be a font limitation: PDFs rendered in the base-14 Helvetica,
 * whose WinAnsi encoding silently garbled pl/cs/ro. That is fixed - lib/pdf
 * embeds Inter, and the certificate and the supplier questionnaire render all
 * ten locales. What still constrains these documents is translation: the
 * labels in policy-labels.ts and export-labels.ts are hand-authored and keyed
 * by this type, so a language the walk gains does not compile until they have it.
 */
export const PDF_LOCALES = WALK_LOCALES;
export type PdfLocale = WalkLocale;

const isPdfLocale = (value: string | undefined): value is PdfLocale =>
  PDF_LOCALES.some((locale) => locale === value);

export function pdfLocale(raw: string | null): PdfLocale {
  const language = raw?.trim().toLowerCase().split("-")[0];
  return isPdfLocale(language) ? language : "en";
}

/**
 * Dates as the walk writes them. English is what every other reader gets, across Europe, so its
 * dates are day first (en-GB): a reader in Lisbon takes "3/12/2026" for 3 December.
 */
export function getDateLocale(locale: string): string {
  return WALK_DATE_LOCALE[pdfLocale(locale)];
}

/** Calendar day in German time, so a decision made just after midnight in
 *  Berlin does not print as the day before on a UTC server. */
export function formatReportDate(date: Date, locale: string): string {
  return date.toLocaleDateString(getDateLocale(locale), { timeZone: "Europe/Berlin" });
}

/** "Name (Role)". Either half alone when the other is missing. */
export function formatSigner(name: string | null, role: string | null): string | null {
  if (name && role) return `${name} (${role})`;
  return name || role || null;
}

/** "12.9.2026, Name". Either half alone when the other is missing. */
export function formatDecision(
  date: Date | null,
  name: string | null,
  locale: string,
): string | null {
  const parts = [date ? formatReportDate(date, locale) : null, name].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

export function formatFieldValue(
  value: unknown,
  fieldType: string,
  locale: string,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") {
    const { yes, no } = exportLabels(pdfLocale(locale));
    return value ? yes : no;
  }

  if (
    fieldType === "date" ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
  ) {
    const d = new Date(value as string);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(getDateLocale(locale));
    }
  }

  if (typeof value === "number") return String(value);
  // Clipped before anything else touches it: react-pdf lays the document out
  // synchronously, and one oversized stored answer was enough to exhaust the
  // container's memory.
  return clipAnswer(String(value)).replace(/_/g, " ");
}
