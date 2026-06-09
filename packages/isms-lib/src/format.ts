/**
 * Locale-aware formatting helpers.
 *
 * Use these instead of inline `.toLocaleDateString()` / `.toString()` calls so
 * the whole app shares one pattern for dates, numbers, and currency.
 *
 * Locale resolution: pass an explicit "de" | "en" | "nl" (use `useLocale()` in
 * client components, `getLocale()` in server components). Internally these map
 * to the matching BCP-47 tag.
 */

type AppLocale = "de" | "en" | "nl";

const BCP47: Record<AppLocale, string> = {
  de: "de-DE",
  en: "en-GB",
  nl: "nl-NL",
};

function tag(locale: string | undefined): string {
  if (!locale) return BCP47.en;
  return BCP47[locale as AppLocale] ?? locale;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * Smart date format: relative for recent (≤7 days), absolute for older.
 *
 *   formatDate(new Date(), "de")       // "vor 2 Stunden"
 *   formatDate("2024-01-15", "en")     // "15 Jan 2024"
 */
export function formatDate(value: Date | string | number | null | undefined, locale: string | undefined = "en"): string {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const absDays = Math.abs(diffMs) / (1000 * 60 * 60 * 24);
  if (absDays <= 7) return formatRelative(d, locale);
  return formatAbsolute(d, locale);
}

/**
 * Always relative ("2 days ago", "in 3 hours") via Intl.RelativeTimeFormat.
 */
export function formatRelative(value: Date | string | number, locale: string | undefined = "en"): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(tag(locale), { numeric: "auto" });
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return rtf.format(Math.round(diffMs / 1000), "second");
  if (abs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diffMs / 86_400_000), "day");
  if (abs < 365 * 86_400_000) return rtf.format(Math.round(diffMs / (30 * 86_400_000)), "month");
  return rtf.format(Math.round(diffMs / (365 * 86_400_000)), "year");
}

/**
 * Absolute short date ("15 Jan 2024", "15.01.2024").
 */
export function formatAbsolute(value: Date | string | number, locale: string | undefined = "en"): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(tag(locale), { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/**
 * Absolute date + time ("15 Jan 2024, 14:32").
 */
export function formatDateTime(value: Date | string | number, locale: string | undefined = "en"): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(tag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ---------------------------------------------------------------------------
// Numbers & currency
// ---------------------------------------------------------------------------

/**
 * Locale-grouped integer or float ("10.000.000" in DE, "10,000,000" in EN).
 */
export function formatNumber(
  value: number | null | undefined,
  locale: string | undefined = "en",
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat(tag(locale), options).format(value);
}

/**
 * Currency formatting. Defaults to EUR.
 *
 *   formatCurrency(10_000_000, "de")          // "10.000.000,00 €"
 *   formatCurrency(10_000_000, "en", "USD")   // "US$10,000,000.00"
 */
export function formatCurrency(
  value: number | null | undefined,
  locale: string | undefined = "en",
  currency = "EUR",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/**
 * Compact number formatting ("1.2K", "3.4M") — useful for dashboard stat tiles.
 */
export function formatCompact(value: number | null | undefined, locale: string | undefined = "en"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat(tag(locale), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * Percentage formatting. Input is a fraction (0.42 → "42%").
 */
export function formatPercent(
  fraction: number | null | undefined,
  locale: string | undefined = "en",
  maximumFractionDigits = 0,
): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return "";
  return new Intl.NumberFormat(tag(locale), { style: "percent", maximumFractionDigits }).format(fraction);
}
