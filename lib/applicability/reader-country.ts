/**
 * The country whose authority leads the applicability page: the one asked for with `?country=XX`,
 * else a Czech reader's own. Undefined when none is chosen, which reads as Germany, the page's
 * default. One rule for the authority list and for the German answer above the tool.
 */
export const readerCountry = (
  locale: string,
  highlightCountry?: string,
): string | undefined =>
  (highlightCountry ?? (locale === "cs" ? "CZ" : undefined))?.toUpperCase();

/** Whether the German reading of the answer applies: no country chosen, or Germany. */
export const isGermanReading = (country: string | undefined): boolean =>
  country === undefined || country === "DE";
