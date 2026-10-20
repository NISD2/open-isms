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
 *   1. user.locale — the UI locale snapshotted at registration. de/en/nl/cs
 *      map directly; the other app locales have no email copy yet, and for
 *      someone who chose French or Polish, English is the safer neighbour
 *      than German. (The OTP emails differ here on purpose: their templates
 *      carry all 10 locales, so a stored "fr" gets a French OTP but an
 *      English digest until the rest of the copy grows past de/en/nl/cs.)
 *   2. company.country — coarse but honest: DACH gets German, NL gets Dutch,
 *      CZ gets Czech.
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
export const EMAIL_LOCALES = [
  "de",
  "en",
  "nl",
  "cs",
] as const satisfies readonly LocaleCode[];

export type EmailLocale = (typeof EMAIL_LOCALES)[number];

export const isEmailLocale = (value: string): value is EmailLocale =>
  EMAIL_LOCALES.some((code) => code === value);

const COUNTRY_LOCALE: Readonly<Record<string, EmailLocale>> = {
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  NL: "nl",
  CZ: "cs",
};

/**
 * The languages a reviewed person has signed off for sending. Having copy (EMAIL_LOCALES) is not
 * enough: on 20.10.2026 an unreviewed Czech invitation went out where English was expected. Every
 * path that picks a mail language ends in `approvedMailLocale`, so a language goes live by being
 * added here, in a change someone reviews, and by no other route.
 */
export const APPROVED_MAIL_LOCALES = ["en"] as const satisfies readonly EmailLocale[];

export const isApprovedMailLocale = (value: string): boolean =>
  APPROVED_MAIL_LOCALES.some((code) => code === value);

/** The language itself when it is approved, English otherwise. */
export const approvedMailLocale = <T extends LocaleCode>(locale: T): T | "en" =>
  isApprovedMailLocale(locale) ? locale : "en";

/** The copy language of a code mail: the request's locale, "de" when unknown. */
export const codeMailLocale = (locale: LocaleCode | undefined): LocaleCode =>
  approvedMailLocale(locale ?? "de");

export function resolveEmailLocale(
  userLocale: string | null,
  companyCountry: string | null,
): EmailLocale {
  return approvedMailLocale(resolveContentLocale(userLocale, companyCountry));
}

/**
 * The language an account reads, whether or not mail has been approved in it: for the text the
 * walk writes for the company and the wording a signer sees. Never for mail, which goes through
 * `resolveEmailLocale` (the 20.10.2026 stop-gap put English into the walk's own records by
 * clamping this one).
 */
export function resolveContentLocale(
  userLocale: string | null,
  companyCountry: string | null,
): EmailLocale {
  if (userLocale && isEmailLocale(userLocale)) return userLocale;
  if (userLocale) return "en";

  const country = companyCountry?.toUpperCase() ?? null;
  if (country) return COUNTRY_LOCALE[country] ?? "en";

  return "de";
}

/**
 * The languages the account and workflow mail is written in (the welcome, invitations,
 * assignments, review decisions, the digests, the course follow-up): English, and Czech for Czech
 * readers. German and Dutch readers keep the English copy these mails always had; their footer
 * still follows their own language.
 */
export type WorkflowMailLocale = "en" | "cs";

export const workflowMailLocaleOf = (locale: EmailLocale): WorkflowMailLocale =>
  locale === "cs" && isApprovedMailLocale("cs") ? "cs" : "en";
