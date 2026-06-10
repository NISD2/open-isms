import { getMergedDictionary, type WikiTerm } from "./index";
import type { Locale } from "@/lib/seo";

export type GlossChunk =
  | { kind: "text"; value: string }
  | {
      kind: "term";
      value: string;
      slug: string;
      definition: string;
      type: WikiTerm["type"];
    };

const matcherCache = new Map<Locale, { regex: RegExp; lookup: ReadonlyMap<string, WikiTerm> }>();

/**
 * Build a sorted-alternation regex for the dictionary, longest term first so
 * compound terms win over their substrings. Unicode-aware word boundaries
 * (\p{L} category) so "BSIG" inside a word like "BSIG-Maßnahmen" still glosses
 * the "BSIG" prefix but not random fragments inside other German words.
 *
 * Memoised per locale.
 */
function getMatcher(locale: Locale) {
  const cached = matcherCache.get(locale);
  if (cached) return cached;

  const lookup = getMergedDictionary(locale);
  if (lookup.size === 0) {
    const empty = { regex: /(?!.*)/u, lookup };
    matcherCache.set(locale, empty);
    return empty;
  }

  const surfaces = Array.from(lookup.keys()).sort((a, b) => b.length - a.length);
  const escaped = surfaces.map(escapeRegex).join("|");
  const regex = new RegExp(`(?<![\\p{L}\\p{N}])(?:${escaped})(?![\\p{L}\\p{N}])`, "giu");

  const matcher = { regex, lookup };
  matcherCache.set(locale, matcher);
  return matcher;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split a string into glossable chunks. Only the FIRST occurrence of any
 * given term is glossed; subsequent occurrences are left as plain text.
 *
 * Pass paragraph-sized strings — the "first occurrence" semantics is
 * per-call, so each <GlossedText> paragraph independently glosses its
 * first hit of every term.
 */
export function glossText(text: string, locale: Locale): GlossChunk[] {
  if (!text) return [];
  const { regex, lookup } = getMatcher(locale);

  const out: GlossChunk[] = [];
  const seen = new Set<string>();
  let lastIndex = 0;
  regex.lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const matched = match[0];
    const start = match.index ?? 0;
    const entry = lookup.get(matched.toLowerCase());

    if (!entry || seen.has(entry.slug)) continue;
    seen.add(entry.slug);

    if (start > lastIndex) {
      out.push({ kind: "text", value: text.slice(lastIndex, start) });
    }
    out.push({
      kind: "term",
      value: matched,
      slug: entry.slug,
      definition: entry.definition,
      type: entry.type,
    });
    lastIndex = start + matched.length;
  }

  if (lastIndex < text.length) {
    out.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return out;
}
