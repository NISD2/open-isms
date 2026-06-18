import cards from "./og-cards.json";

/**
 * Pre-rendered Open Graph cards, produced by og-shot from og.config.json and
 * written to lib/og-cards.json. Keyed by route slug, then locale. Regenerate
 * with `node ~/repositories/og-shot/dist/cli.js` (or `npx og-shot` once the
 * package is installed) from the repo root.
 */
const manifest: Record<string, Record<string, string>> = cards;

/**
 * Public URL of the card for a route slug + locale, or undefined when none
 * exists (an untranslated locale, or a route without a card) so the caller
 * falls back to the default. Accepts either a short slug ("about") or a full
 * page slug ("wiki/umsetzung/nis2-meldepflicht"); the last path segment is the
 * card key.
 */
export function ogCard(slug: string, locale: string): string | undefined {
  const key = slug.split("/").filter(Boolean).pop() ?? slug;
  return manifest[key]?.[locale];
}

/**
 * The Next.js `openGraph.images` array for a route's card, or undefined to
 * inherit the default. For pages that build metadata by hand instead of via
 * `pageOg`.
 */
export function ogImages(slug: string, locale: string, alt: string) {
  const url = ogCard(slug, locale);
  return url ? [{ url, width: 1200, height: 630, alt }] : undefined;
}
