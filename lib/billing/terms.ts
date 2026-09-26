/**
 * The version of the AGB (/terms) and the AVV (/avv) that an order accepts. One date for both,
 * because the AVV is an annex of the AGB and they are accepted with one checkbox.
 *
 * Change it in the same commit that changes the text of either page: every order stores the version
 * it was placed under (invoice.terms_version), and the pages print it as "Fassung vom".
 */
export const TERMS_VERSION = "2026-09-27";

/** The version as the reader writes a date: "26.09.2026", "26 September 2026". */
export const termsVersionLabel = (
  locale: string,
  version: string = TERMS_VERSION,
): string =>
  new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "nl" ? "nl-NL" : "en-GB",
    {
      dateStyle: locale === "de" ? "medium" : "long",
      timeZone: "UTC",
    },
  ).format(new Date(`${version}T12:00:00Z`));
