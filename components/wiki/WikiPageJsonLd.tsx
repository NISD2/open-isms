import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import {
  buildBreadcrumbListJsonLd,
  buildTechArticleJsonLd,
  type Locale,
} from "@/lib/seo";
import {
  WIKI_TOC,
  type WikiTopLevel,
  type WikiTocEntry,
} from "@/lib/content/wiki-toc";
import { AUTHORS, type DocsAuthor } from "@/lib/content/authors";
import { isPublished } from "@/lib/content/wiki-publish-schedule";

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
  /** Current request locale. */
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
  const isEn = locale === "en";
  const author = AUTHORS[authorSlug];

  const pageSlugPath = `wiki/${category}/${slug}`;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nisd2.eu";

  const headline = entry
    ? isEn
      ? entry.titleEn ?? entry.titleDe
      : entry.titleDe
    : slug;
  const summary = entry
    ? isEn
      ? entry.summaryEn ?? entry.summaryDe
      : entry.summaryDe
    : "";
  const sectionTitle = isEn ? meta.titleEn : meta.titleDe;

  const legId = (key: string) => `${baseUrl}/wiki/zitate/${key}#legislation`;

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
    audienceType,
    audienceCountry,
    aboutLegislationIds: aboutKeys.map(legId),
    mentionsLegislationIds: mentionsKeys.map(legId),
    citationLegislationIds: citationKeys.map(legId),
    breadcrumbId: `${baseUrl}/${pageSlugPath}#breadcrumb`,
  });

  const breadcrumb = buildBreadcrumbListJsonLd(
    [
      { name: isEn ? "Home" : "Startseite", url: "/" },
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
