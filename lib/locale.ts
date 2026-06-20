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
