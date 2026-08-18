/**
 * Shared formatting utilities for PDF document rendering.
 */

export type PdfLocale = "en" | "de";

/**
 * PDF text renders with the base-14 Helvetica fonts only (WinAnsi/CP1252
 * encoding), which silently garbles pl/cs/ro characters. Until a Unicode
 * font is registered via Font.register, PDFs render only in the two
 * hand-authored locales and everything else falls back to English.
 */
export function pdfLocale(raw: string | null): PdfLocale {
  return raw?.trim().toLowerCase().split("-")[0] === "de" ? "de" : "en";
}

export function getDateLocale(locale: string): string {
  return locale === "de" ? "de-DE" : "en-US";
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
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(getDateLocale(locale));
    }
  }

  if (typeof value === "number") return String(value);
  return String(value).replace(/_/g, " ");
}
