import wikiI18n from "./wiki-toc-i18n.json";

/**
 * The languages a wiki page's own furniture is written in: the meta strip, the glossary pop-ups,
 * the JSON-LD and the TOC titles. Czech has its own because a Czech page cites Czech law and is
 * read by Czech companies; every other locale reads the German furniture, as it did before.
 */
export const WIKI_LOCALES = ["de", "en", "nl", "cs"] as const;

export type WikiLocale = (typeof WIKI_LOCALES)[number];

export const isWikiLocale = (raw: string): raw is WikiLocale =>
  WIKI_LOCALES.some((locale) => locale === raw);

/** The wiki's language for a request locale: its own where the wiki has one, else German. */
export const wikiLocale = (raw: string): WikiLocale => (isWikiLocale(raw) ? raw : "de");

/**
 * A label a page writes in code, such as the provision badge in its header: the Czech wording on
 * a Czech page, the one wording every other locale has always shown.
 */
export const wikiLabel = (
  locale: WikiLocale,
  label: { readonly cs: string; readonly other: string },
): string => (locale === "cs" ? label.cs : label.other);

export type TocField = "title" | "summary" | "question";

const TOC_TRANSLATIONS = wikiI18n as Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>
>;

/** A category's (`cat:<slug>`) or entry's (`entry:<slug>`) translated nav text, null where there is none. */
export const tocTranslation = (
  key: string,
  field: TocField,
  locale: string,
): string | null => TOC_TRANSLATIONS[key]?.[locale]?.[field] ?? null;

/**
 * A TOC text in the wiki's language. German and English come from the TOC itself, Czech from its
 * translations, falling back to English for a gap as the hub does.
 */
export const wikiTocText = (
  locale: WikiLocale,
  key: string,
  field: TocField,
  text: { readonly de: string; readonly en: string },
): string => {
  if (locale === "en") return text.en;
  if (locale === "cs") return tocTranslation(key, field, locale) ?? text.en;
  return text.de;
};
