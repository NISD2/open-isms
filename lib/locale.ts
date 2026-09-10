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
 * Every locale this app serves. THE source: `i18n/routing.ts` passes this list
 * straight to `defineRouting`, so `routing.locales` and this constant cannot
 * name different sets. `Locale` in lib/seo.ts is an alias of `LocaleCode`, not
 * a second union.
 *
 * Order is routing order, default first. The switcher shows a different order;
 * see LOCALE_LABELS.
 *
 * Adding one means: a code here, a label below (the compiler demands it), and
 * a `messages/<code>.json`.
 */
export const LOCALE_CODES = [
  "de",
  "en",
  "nl",
  "fr",
  "it",
  "es",
  "pl",
  "cs",
  "pt",
  "ro",
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

/**
 * Native endonyms, in the order the switcher dropdown lists them — English
 * first, which is why this is its own object and not a field on LOCALE_CODES.
 * Membership lives in one place, presentation in another, and `satisfies`
 * welds them: a code added to LOCALE_CODES without a label here fails to
 * compile rather than rendering a blank dropdown row.
 */
const LOCALE_LABELS = {
  en: "English",
  de: "Deutsch",
  nl: "Nederlands",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  pl: "Polski",
  cs: "Čeština",
  pt: "Português",
  ro: "Română",
} as const satisfies Record<LocaleCode, string>;

/**
 * Locales offered in the UI language switchers (public navbar + portal
 * sidebar), as `{ code, label }` in dropdown order.
 */
export const LOCALES: readonly { code: LocaleCode; label: string }[] = (
  Object.keys(LOCALE_LABELS) as LocaleCode[]
).map((code) => ({ code, label: LOCALE_LABELS[code] }));

/**
 * Narrows an untrusted string to a locale the app actually serves. The one
 * guard: the three auth routes, the OAuth cookie read, `user.setLocale` and
 * lib/seo.ts all go through it, each of which used to carry its own `.some()`
 * or `.includes()` plus the cast that `.some()` forces.
 */
export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return LOCALE_CODES.some((code) => code === value);
}

/**
 * The cookie next-intl writes to record which language a visitor is reading.
 *
 * The middleware sets it on every page request, not only when someone uses the
 * switcher: `GET /` answers `NEXT_LOCALE=de` and `GET /en/pricing` answers
 * `NEXT_LOCALE=en`, both `Path=/; SameSite=lax`. That is what makes it readable
 * from the Google OAuth callback, which arrives as a top-level redirect and so
 * carries lax cookies.
 *
 * "NEXT_LOCALE" is next-intl's own default; naming it here and passing it to
 * `localeCookie` in i18n/routing.ts makes the string one value rather than a
 * default on one side and a guess on the other.
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";
