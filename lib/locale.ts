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
