import type { Locale } from "@/lib/seo";
import type { DictionaryTerm } from "@/lib/training/schemas";
import { pickLocale, slugify } from "./index";
import { DICTIONARY_SOURCES, type DictionarySourceId } from "./sources";

export interface GlossaryEntry {
  /** Canonical English term. The anchor and the hover glosser both key on it. */
  term: string;
  slug: string;
  definition: string;
  legalRef: string | null;
  /** Other names in the active locale, e.g. "Geschäftsleitung" for "Management body". */
  aliases: readonly string[];
  /** Every dictionary that defines the term, in priority order. */
  sources: readonly DictionarySourceId[];
}

/** The `defined` terms, plus any `vocabulary` term promoted by hand. */
export const isInGlossary = (entry: DictionaryTerm): boolean =>
  entry.inGlossary ?? entry.type === "defined";

interface Group {
  /** The winning entry: the one the hover glosser shows, so the two never disagree. */
  winner: DictionaryTerm;
  listed: boolean;
  sources: DictionarySourceId[];
  legalRef: Readonly<Record<string, string>> | undefined;
}

function groupByTerm(): ReadonlyMap<string, Group> {
  const groups = new Map<string, Group>();
  for (const { id, terms } of DICTIONARY_SOURCES) {
    for (const entry of terms) {
      const key = entry.term.toLowerCase();
      const group = groups.get(key);
      if (!group) {
        groups.set(key, {
          winner: entry,
          listed: isInGlossary(entry),
          sources: [id],
          legalRef: entry.legalRef,
        });
        continue;
      }
      group.listed ||= isInGlossary(entry);
      group.legalRef ??= entry.legalRef;
      if (!group.sources.includes(id)) group.sources.push(id);
    }
  }
  return groups;
}

const GROUPS = groupByTerm();

function entryOf(group: Group, locale: Locale): GlossaryEntry {
  const { winner } = group;
  const aliasMap: Partial<Record<string, string[]>> | undefined = winner.aliases;
  return {
    term: winner.term,
    slug: slugify(winner.term),
    definition: pickLocale(winner.definition, locale),
    legalRef: group.legalRef ? pickLocale(group.legalRef, locale) || null : null,
    aliases: (aliasMap?.[locale] ?? []).filter(
      (alias) => alias.toLowerCase() !== winner.term.toLowerCase(),
    ),
    sources: group.sources,
  };
}

/**
 * One dictionary term in a locale, listed on the public glossary or not. The
 * walkthrough's reference rail reads its terms here, so it shows the same
 * checked definition as the glossary and the hover.
 */
export function getTermEntry(term: string, locale: Locale): GlossaryEntry | undefined {
  const group = GROUPS.get(term.toLowerCase());
  const entry = group && entryOf(group, locale);
  return entry && entry.definition !== "" ? entry : undefined;
}

const entriesCache = new Map<Locale, readonly GlossaryEntry[]>();

/** The terms the public glossary lists, A to Z in the locale's own collation. */
export function getGlossary(locale: Locale): readonly GlossaryEntry[] {
  const cached = entriesCache.get(locale);
  if (cached) return cached;

  const collator = new Intl.Collator(locale);
  const entries = [...GROUPS.values()]
    .filter((group) => group.listed)
    .map((group) => entryOf(group, locale))
    .filter((entry) => entry.definition !== "")
    .sort((a, b) => collator.compare(a.term, b.term));

  entriesCache.set(locale, entries);
  return entries;
}

export type GlossaryRow =
  | { kind: "entry"; label: string; entry: GlossaryEntry }
  /** A German or Dutch name that points at the English entry. */
  | { kind: "see"; label: string; entry: GlossaryEntry };

export interface GlossaryLetter {
  letter: string;
  rows: readonly GlossaryRow[];
}

const NON_LETTER_GROUP = "#";

const letterOf = (label: string): string => {
  const [first = ""] = Array.from(label);
  return /^\p{L}$/u.test(first) ? first.toLocaleUpperCase() : NON_LETTER_GROUP;
};

/**
 * The glossary as an A to Z index. A term that has a name in the reader's
 * language is also filed under that name, so a German reader looking for
 * "Geschäftsleitung" lands on "Management body".
 */
export function glossaryByLetter(locale: Locale): readonly GlossaryLetter[] {
  const entries = getGlossary(locale);
  const taken = new Set(entries.map((entry) => entry.term.toLowerCase()));
  const rows: GlossaryRow[] = [
    ...entries.map((entry): GlossaryRow => ({ kind: "entry", label: entry.term, entry })),
    ...entries.flatMap((entry) =>
      entry.aliases
        .filter((alias) => !taken.has(alias.toLowerCase()))
        .map((alias): GlossaryRow => ({ kind: "see", label: alias, entry })),
    ),
  ];

  const collator = new Intl.Collator(locale);
  const byLetter = Map.groupBy(rows, (row) => letterOf(row.label));
  return [...byLetter.entries()]
    .map(([letter, letterRows]) => ({
      letter,
      rows: letterRows.sort((a, b) => collator.compare(a.label, b.label)),
    }))
    .sort((a, b) =>
      a.letter === NON_LETTER_GROUP
        ? -1
        : b.letter === NON_LETTER_GROUP
          ? 1
          : collator.compare(a.letter, b.letter),
    );
}
