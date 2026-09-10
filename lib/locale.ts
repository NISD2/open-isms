/**
 * Pick a value from a locale-keyed bundle. Falls back to `fallback`
 * (default "en"), then to any present value. One shared implementation for
 * the per-page / per-route locale pickers that used to be duplicated.
 */
export function pickLocalized<T>(
  bundle: Partial<Record<string, T>>,
  locale: string,
  fallback = "en",
): T {
  const value = bundle[locale] ?? bundle[fallback];
  if (value !== undefined) return value;
  for (const candidate of Object.values(bundle)) {
    if (candidate !== undefined) return candidate;
  }
  throw new Error("pickLocalized: bundle has no values");
}

/**
 * Locales offered in the UI language switchers (public navbar + portal
 * sidebar), with their native endonym labels. Single source of truth so the
 * two switchers stay in sync; every `code` must exist in i18n/routing.ts.
 */
export const LOCALES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Čeština" },
  { code: "pt", label: "Português" },
  { code: "ro", label: "Română" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

/**
 * Narrows an untrusted string to a locale the app actually serves.
 *
 * The three auth routes each carried their own copy of
 * `LOCALES.some((l) => l.code === x) ? (x as LocaleCode) : fallback`, and each
 * copy needed the cast because `.some()` proves nothing to the compiler. A type
 * predicate proves it once and the casts go away.
 */
export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

/**
 * The cookie next-intl writes when a visitor switches language.
 *
 * "NEXT_LOCALE" is next-intl's own default; naming it here and passing it to
 * `localeCookie` in i18n/routing.ts makes the string one value rather than a
 * default on one side and a guess on the other. The OAuth signup path reads it
 * to seed `user.locale`, which is the only reason it has to be nameable at all.
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";
