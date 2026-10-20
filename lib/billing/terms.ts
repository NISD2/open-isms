/**
 * The version of the AGB (/terms) and the AVV (/avv) that an order accepts. One date for both,
 * because the AVV is an annex of the AGB and they are accepted with one checkbox.
 *
 * Change it in the same commit that changes the text of either page: every order stores the version
 * it was placed under (invoice.terms_version), and the pages print it as "Fassung vom".
 */
export const TERMS_VERSION = "2026-10-20";

/**
 * The first version under which the first export or sign-off ends the thirty days money back (B7).
 * An order placed under an earlier version, or before versions were recorded, keeps the money back
 * that version promised.
 */
export const PAY_ON_USE_SINCE = "2026-10-20";

/** Whether an order accepted under this version (null: not recorded) carries the B7 rule above. */
export const paysOnUse = (version: string | null): boolean =>
  version !== null && version >= PAY_ON_USE_SINCE;

/** How each language writes the date; any other reads it the British way, as the terms do. */
const VERSION_DATE: Partial<
  Record<string, { readonly intl: string; readonly style: "medium" | "long" }>
> = {
  de: { intl: "de-DE", style: "medium" },
  nl: { intl: "nl-NL", style: "long" },
  cs: { intl: "cs-CZ", style: "long" },
};

/** The version as the reader writes a date: "26.09.2026", "26 September 2026", "26. září 2026". */
export const termsVersionLabel = (
  locale: string,
  version: string = TERMS_VERSION,
): string => {
  const { intl, style } = VERSION_DATE[locale] ?? { intl: "en-GB", style: "long" };
  return new Intl.DateTimeFormat(intl, { dateStyle: style, timeZone: "UTC" }).format(
    new Date(`${version}T12:00:00Z`),
  );
};
