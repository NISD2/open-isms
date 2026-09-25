/**
 * Shared formatting utilities for PDF document rendering.
 */

export type PdfLocale = "en" | "de";

/**
 * The report and policy documents ship in two languages.
 *
 * This used to be a font limitation: PDFs rendered in the base-14 Helvetica,
 * whose WinAnsi encoding silently garbled pl/cs/ro. That is fixed - lib/pdf
 * embeds Inter, and the certificate and the supplier questionnaire render all
 * ten locales. What still constrains these two documents is translation:
 * policy-labels.ts is hand-authored and only has en and de. Adding a locale
 * there is now the only thing standing between them and the rest of the set.
 */
export function pdfLocale(raw: string | null): PdfLocale {
  return raw?.trim().toLowerCase().split("-")[0] === "de" ? "de" : "en";
}

export function getDateLocale(locale: string): string {
  return locale === "de" ? "de-DE" : "en-US";
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
  if (value === true) return locale === "de" ? "Ja" : "Yes";
  if (value === false) return locale === "de" ? "Nein" : "No";

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
  return String(value).replace(/_/g, " ");
}
