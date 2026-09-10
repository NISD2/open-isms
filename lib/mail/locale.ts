/**
 * Which language an email is written in.
 *
 * Lives under lib/mail rather than lib/lifecycle because it is not a
 * lifecycle concern: the digest footer needs it too, and lib/mail must not
 * import from lib/lifecycle when lifecycle already imports from lib/mail.
 *
 * An in-request email could read the request locale, but a cron has nothing
 * to read, so the language comes from what the account left behind:
 *
 *   1. user.locale — the UI locale snapshotted at registration. de/en/nl map
 *      directly; the other app locales have no email copy yet, and for
 *      someone who chose French or Polish, English is the safer neighbour
 *      than German. (The OTP emails differ here on purpose: their templates
 *      carry all 10 locales, so a stored "fr" gets a French OTP but an
 *      English digest until the rest of the copy grows past de/en/nl.)
 *   2. company.country — coarse but honest: DACH gets German, NL gets Dutch.
 *   3. "de" — the platform default (DE-canonical site, German target market;
 *      same nothing-known fallback the OTP emails use).
 */
import type { LocaleCode } from "@/lib/locale";

/**
 * The languages our email copy exists in, as a subset of the app's locales.
 * Narrower than LocaleCode on purpose: it asserts "someone has written the mail
 * in this", not "the site serves this". Typing it against LocaleCode means a
 * language that is not a real app locale cannot be listed here.
 */
export const EMAIL_LOCALES = ["de", "en", "nl"] as const satisfies readonly LocaleCode[];

export type EmailLocale = (typeof EMAIL_LOCALES)[number];

const GERMAN_SPEAKING_COUNTRIES: ReadonlySet<string> = new Set(["DE", "AT", "CH", "LI"]);

export function resolveEmailLocale(
  userLocale: string | null,
  companyCountry: string | null,
): EmailLocale {
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
