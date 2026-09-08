/**
 * Language selection for emails sent OUTSIDE a request context.
 *
 * In-request emails read the request locale; a cron has nothing to read, so
 * lifecycle emails resolve a language from what the account left behind:
 *
 *   1. user.locale — the UI locale snapshotted at registration. de/en/nl map
 *      directly; the other app locales have no lifecycle copy yet, and for
 *      someone who chose French or Polish, English is the safer neighbour
 *      than German. (The OTP emails differ here on purpose: their templates
 *      carry all 10 locales, so a stored "fr" gets a French OTP but an
 *      English lifecycle email until lifecycle copy grows past de/en/nl.)
 *   2. company.country — coarse but honest: DACH gets German, NL gets Dutch.
 *   3. "de" — the platform default (DE-canonical site, German target market;
 *      same nothing-known fallback the OTP emails use).
 */

export type LifecycleLocale = "de" | "en" | "nl";

const GERMAN_SPEAKING_COUNTRIES: ReadonlySet<string> = new Set(["DE", "AT", "CH", "LI"]);

export function resolveEmailLocale(
  userLocale: string | null,
  companyCountry: string | null,
): LifecycleLocale {
  if (userLocale === "de" || userLocale === "en" || userLocale === "nl") {
    return userLocale;
  }
  if (userLocale) return "en";

  const country = companyCountry?.toUpperCase() ?? null;
  if (country && GERMAN_SPEAKING_COUNTRIES.has(country)) return "de";
  if (country === "NL") return "nl";
  if (country) return "en";

  return "de";
}
