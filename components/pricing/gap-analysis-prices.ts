import { formatWholeEuro } from "@/lib/billing/order";

/**
 * Published one-off prices for a NIS 2 gap analysis, each from the provider's own page: cyberkom
 * 2.000 fixed (up to 500 staff), ing-ism from 3.900 and from 6.900, Blackfort "Gap" from 4.900,
 * DATAGROUP 4.990, secunet from 5.000. Blackfort's 8.500 tier adds a roadmap and is left out.
 * Most are starting prices, which the copy says; most pages do not say net, so the copy does not.
 * A price comparison must be verifiable (§ 6 Abs. 2 Nr. 2 UWG), so the sources are named on the
 * page, and a stale one misleads (§ 5 UWG): re-check every quarter and move `checked`.
 */
const GAP_ANALYSIS_PRICES = {
  lowCents: 200_000,
  highCents: 690_000,
  sources: ["cyberkom", "ing-ism", "Blackfort", "DATAGROUP", "secunet"],
  checked: "2026-10-04",
} as const;

export const gapAnalysisRange = (locale: string) => ({
  low: formatWholeEuro(GAP_ANALYSIS_PRICES.lowCents, locale),
  high: formatWholeEuro(GAP_ANALYSIS_PRICES.highCents, locale),
  sources: new Intl.ListFormat(locale, { type: "conjunction" }).format(
    GAP_ANALYSIS_PRICES.sources,
  ),
  checked: new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${GAP_ANALYSIS_PRICES.checked}T12:00:00Z`)),
});
