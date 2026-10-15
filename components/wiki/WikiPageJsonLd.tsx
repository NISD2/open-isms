import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { AUTHORS, type DocsAuthor } from "@/lib/content/authors";
import type { LegislationKey } from "@/lib/content/citations";
import { type WikiLocale, wikiLocale, wikiTocText } from "@/lib/content/wiki-locale";
import { isPublished } from "@/lib/content/wiki-publish-schedule";
import { WIKI_TOC, type WikiTocEntry, type WikiTopLevel } from "@/lib/content/wiki-toc";
import {
  buildBreadcrumbListJsonLd,
  buildTechArticleJsonLd,
  type Locale,
} from "@/lib/seo";

const HOME: Record<WikiLocale, string> = {
  de: "Startseite",
  en: "Home",
  nl: "Startseite",
  cs: "Domů",
};

/** Who a Czech page is for: the Czech companies the Czech Act covers, not the German audience a page names. */
const CZECH_AUDIENCE = {
  type: "Vedení a IT ve středních firmách",
  country: "Česko",
} as const;

/** The German acts a page cites, as a Czech page cites them: the Czech Act is the reader's law there. */
const CZECH_FOR_GERMAN: Readonly<Partial<Record<string, LegislationKey>>> = {
  bsig: "zkb",
  "bsi-kritisv": "zkb",
};

/** A page's legislation keys on a Czech page: German law becomes the Czech Act, once. */
const czechKeys = (keys: readonly string[]): string[] =>
  Array.from(new Set(keys.map((key) => CZECH_FOR_GERMAN[key] ?? key)));

/**
 * One-line JSON-LD drop-in for every wiki content page.
 *
 * Emits:
 *   - TechArticle (with abstract, audience, citation chain, speakable,
 *     sdPublisher meta, isAccessibleForFree, CC-BY-SA license).
 *   - BreadcrumbList (Home > Wiki > Category > Page).
 *
 * The author byline is resolved from authorSlug (default Simon for
 * sector/business/positioning content, Cory for technical content —
 * caller picks per page). Persons themselves are NOT emitted; they
 * are referenced by @id and declared in full on /autor/<slug>.
 *
 * Legislation citations are emitted as @id references to nodes
 * declared once on /wiki/zitate, never duplicated here.
 */
export function WikiPageJsonLd({
  category,
  slug,
  locale,
  authorSlug = "simon-orzel",
  datePublished,
  dateModified,
  abstract,
  wordCount,
  citationKeys = [],
  aboutKeys = [],
  mentionsKeys = [],
  proficiencyLevel,
  audienceType,
  audienceCountry = "Deutschland",
  image,
}: {
  /** Wiki top-level category. */
  category: WikiTopLevel;
  /** German-canonical slug under the category. Matches the directory name. */
  slug: string;
  /** The page's language: `inLanguage`. Titles and labels follow the wiki's language for it. */
  locale: Locale;
  /** Which author's byline. Defaults to Simon. */
  authorSlug?: DocsAuthor["slug"];
  /** ISO 8601. Defaults to "2026-05-29" if omitted (will be improved with per-page metadata). */
  datePublished?: string;
  /** ISO 8601. Defaults to datePublished. */
  dateModified?: string;
  /** Optional abstract for AI Overviews — distinct from meta description. */
  abstract?: string;
  /** Optional word count for the "long-form authority" signal. */
  wordCount?: number;
  /** Legislation keys from lib/content/citations.ts, e.g. ["nis2", "bsig"]. */
  citationKeys?: string[];
  /** Legislation keys this article is fundamentally about. */
  aboutKeys?: string[];
  /** Legislation keys merely mentioned. */
  mentionsKeys?: string[];
  proficiencyLevel?: "Beginner" | "Intermediate" | "Expert";
  audienceType?: string;
  audienceCountry?: string;
  /** Optional override image URL (1200x630 OG). Defaults to /og-default.png. */
  image?: string;
}) {
  // Publish-schedule guard: in production, scheduled-but-not-yet-live
  // pages return 404 so direct-URL access does not bypass the queue.
  // In development the page renders normally so authors can preview.
  if (process.env.NODE_ENV === "production" && !isPublished(slug)) {
    notFound();
  }

  const meta = WIKI_TOC[category];
  const entry: WikiTocEntry | undefined = meta.entries.find((e) => e.slug === slug);
  const author = AUTHORS[authorSlug];
  const wiki = wikiLocale(locale);
  const audience =
    wiki === "cs" ? CZECH_AUDIENCE : { type: audienceType, country: audienceCountry };

  const pageSlugPath = `wiki/${category}/${slug}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nisd2.eu";

  const headline = entry
    ? wikiTocText(wiki, `entry:${slug}`, "title", {
        de: entry.titleDe,
        en: entry.titleEn ?? entry.titleDe,
      })
    : slug;
  const summary = entry
    ? wikiTocText(wiki, `entry:${slug}`, "summary", {
        de: entry.summaryDe,
        en: entry.summaryEn ?? entry.summaryDe,
      })
    : "";
  const sectionTitle = wikiTocText(wiki, `cat:${category}`, "title", {
    de: meta.titleDe,
    en: meta.titleEn,
  });

  const legIds = (keys: readonly string[]) =>
    (wiki === "cs" ? czechKeys(keys) : keys).map(
      (key) => `${baseUrl}/wiki/zitate/${key}#legislation`,
    );

  const techArticle = buildTechArticleJsonLd({
    slug: pageSlugPath,
    locale,
    headline,
    description: summary,
    abstract,
    datePublished: datePublished ?? "2026-05-29",
    dateModified: dateModified ?? entry?.lastReviewedAt ?? datePublished ?? "2026-05-29",
    authorPersonId: `${baseUrl}${author.profileUrl}#person`,
    image,
    articleSection: sectionTitle,
    wordCount,
    keywords: entry?.tags,
    proficiencyLevel,
    dependencies: undefined,
    audienceType: audience.type,
    audienceCountry: audience.country,
    aboutLegislationIds: legIds(aboutKeys),
    mentionsLegislationIds: legIds(mentionsKeys),
    citationLegislationIds: legIds(citationKeys),
    breadcrumbId: `${baseUrl}/${pageSlugPath}#breadcrumb`,
  });

  const breadcrumb = buildBreadcrumbListJsonLd(
    [
      { name: HOME[wiki], url: "/" },
      { name: "Wiki", url: "/wiki" },
      { name: sectionTitle, url: `/wiki/${category}` },
      { name: headline, url: `/${pageSlugPath}` },
    ],
    `${baseUrl}/${pageSlugPath}#breadcrumb`,
  );

  return (
    <>
      <JsonLd data={techArticle} />
      <JsonLd data={breadcrumb} />
    </>
  );
}
