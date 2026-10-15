import { z } from "zod";
import czechRaw from "@/data/changelog-cs.json";
import { pickLocalized } from "@/lib/locale";
import type { Category, ChangelogEntry, ChangelogLink } from "./types";

const CzechChangelogSchema = z.object({
  entries: z.record(
    z.string(),
    z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      /** Link labels by the link's href. */
      links: z.record(z.string(), z.string().min(1)).optional(),
    }),
  ),
});

/**
 * The Czech rendering of each entry, by its id. Dates, categories, versions and hrefs stay in
 * changelog.json, so this file holds only words.
 */
export const czechChangelog = CzechChangelogSchema.parse(czechRaw).entries;

/** One entry in the reader's language, as the changelog page shows it. */
export interface ChangelogView {
  readonly id: string;
  readonly date: string;
  readonly category: Category;
  readonly version: string | undefined;
  readonly title: string;
  readonly body: string;
  readonly links: readonly { readonly href: string; readonly label: string }[];
}

interface EntryText {
  readonly title: string;
  readonly body: string;
  readonly label: (link: ChangelogLink) => string;
}

const german = (entry: ChangelogEntry): EntryText => ({
  title: entry.titleDe,
  body: entry.bodyDe,
  label: (link) => link.labelDe,
});

const english = (entry: ChangelogEntry): EntryText => ({
  title: entry.titleEn,
  body: entry.bodyEn,
  label: (link) => link.labelEn,
});

/** English only for an entry still missing its Czech rendering; the changelog test fails on one. */
const czech = (entry: ChangelogEntry): EntryText => {
  const text = czechChangelog[entry.id];
  return text === undefined
    ? english(entry)
    : {
        title: text.title,
        body: text.body,
        label: (link) => text.links?.[link.href] ?? link.labelEn,
      };
};

const TEXT_BY_LOCALE = { de: german, en: english, cs: czech };

/** The entries in the reader's language: German, Czech, and English for every other locale. */
export const localizeChangelog = (
  entries: readonly ChangelogEntry[],
  locale: string,
): ChangelogView[] => {
  const textOf = pickLocalized(TEXT_BY_LOCALE, locale);
  return entries.map((entry) => {
    const text = textOf(entry);
    return {
      id: entry.id,
      date: entry.date,
      category: entry.category,
      version: entry.version,
      title: text.title,
      body: text.body,
      links: (entry.links ?? []).map((link) => ({
        href: link.href,
        label: text.label(link),
      })),
    };
  });
};
