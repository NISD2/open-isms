import type { Locale } from "@/lib/seo";
import { DICTIONARY_SOURCES } from "./sources";

export interface WikiTerm {
  /** Original casing, used as the dictionary entry key. */
  term: string;
  /** Lowercase, hyphenated. Stable id for data-term attribute. */
  slug: string;
  /** Categorisation from the course dictionary. */
  type: "defined" | "vocabulary";
  /** Definition already resolved to the requested locale (falls back to EN). */
  definition: string;
}

const cache = new Map<Locale, ReadonlyMap<string, WikiTerm>>();

/** A dictionary value for the locale, falling back to English, then German. */
export function pickLocale(
  values: Readonly<Record<string, string>>,
  locale: Locale,
): string {
  return values[locale] ?? values.en ?? values.de ?? "";
}

/**
 * Merged dictionary across all three course sources (CEO, tabletop, CRA).
 * The map key is the lowercased term, the value is the locale-resolved entry.
 *
 * First write wins (CEO is loaded first because it is the most authoritative
 * NIS 2 set). Returns a frozen map. Memoised per locale.
 */
export function getMergedDictionary(locale: Locale): ReadonlyMap<string, WikiTerm> {
  const hit = cache.get(locale);
  if (hit) return hit;

  const merged = new Map<string, WikiTerm>();
  for (const { terms } of DICTIONARY_SOURCES) {
    for (const entry of terms) {
      const def = pickLocale(entry.definition, locale);
      if (!def) continue;
      const wikiTerm: WikiTerm = {
        term: entry.term,
        slug: slugify(entry.term),
        type: entry.type,
        definition: def,
      };

      // Course dictionaries carry aliases for de/en/nl only; newer locales
      // simply have none. Widen the alias map (not the locale) so an unknown
      // locale yields undefined rather than falsely narrowing the locale type.
      const aliasMap = entry.aliases as Partial<Record<string, string[]>> | undefined;
      const aliases = aliasMap?.[locale];
      const surfaces = [entry.term, ...(aliases ?? [])];
      for (const surface of surfaces) {
        const key = surface.toLowerCase();
        if (merged.has(key)) continue;
        merged.set(key, wikiTerm);
      }
    }
  }

  cache.set(locale, merged);
  return merged;
}

export function slugify(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "-");
}
