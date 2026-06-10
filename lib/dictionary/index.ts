import ceoDict from "@/courses/nis2-ceo/dictionary";
import tabletopDict from "@/courses/nis2-tabletop/dictionary";
import craDict from "@/courses/cra-sbom/dictionary";
import type { Locale } from "@/lib/seo";

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
  for (const source of [ceoDict, tabletopDict, craDict]) {
    for (const entry of source) {
      const def =
        entry.definition[locale] ?? entry.definition.en ?? entry.definition.de ?? "";
      if (!def) continue;
      const wikiTerm: WikiTerm = {
        term: entry.term,
        slug: slugify(entry.term),
        type: entry.type,
        definition: def,
      };

      const surfaces = [entry.term, ...(entry.aliases?.[locale] ?? [])];
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

function slugify(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "-");
}
