/**
 * Docs page registry.
 *
 * The single source of truth for every page under `/wiki`. Drives:
 *   - The sitemap ramp (only entries with `publishedAt <= now` ship).
 *   - The dynamic `[slug]/page.tsx` route lookup.
 *   - Author profile pages ("Articles by Simon" / "Articles by Cory").
 *   - Internal-link suggestions (related_slugs).
 *   - The generation prompt input (one entry → one prompt run).
 *
 * Empty by design — entries land here when the founder approves a batch
 * of pages from the content map for generation. No entry should be
 * registered before the founder gives the explicit go signal.
 *
 * Defined here: 2026-05-29 alongside docs-architecture-2026-05-29.md.
 */

import type { DocsCategory, DocsContentType } from "./content-types";
import type { DocsAuthor } from "./authors";
import type { AudienceRole, SectorTag } from "./wiki-toc";

export interface DocsPageEntry {
  /** URL slug within the category. Combined with category as `/wiki/<category>/<slug>`. */
  slug: string;
  /** Docs category. */
  category: DocsCategory;
  /** Schema.org subtype emitted for this page. */
  contentType: DocsContentType;
  /** Locale of this entry. One entry per locale per slug. */
  locale: "de" | "en" | "nl";
  /** ISO 8601 publication date with timezone. sitemap.ts filters by this. */
  publishedAt: string;
  /** ISO 8601 last-modified date. Defaults to publishedAt on first publish. */
  dateModified?: string;
  /** Author byline. */
  authorSlug: DocsAuthor["slug"];
  /** H1 / og:title / Article.headline. Max ~110 chars. */
  headline: string;
  /** meta description / og:description / Article.description. Max ~160 chars. */
  description: string;
  /**
   * Priority score (0-100). Drives sitemap ramp ordering — higher
   * priority pages get earlier publishedAt timestamps. See architecture
   * doc §4.3 for the scoring rubric.
   */
  priorityScore: number;
  /** EU article citation required in the page body (verbatim). */
  euAnchor: string;
  /**
   * Related docs slugs for internal linking. Each entry refers to the
   * `slug` field of another DocsPageEntry. 3-5 entries recommended.
   */
  relatedSlugs: string[];
  /** schema.org Thing entries for Article.about. Improves topical relevance. */
  about: Array<{ name: string; sameAs?: string }>;
  /** Optional override image URL. Falls back to category default OG image. */
  image?: string;
  /**
   * If this page replaces a legacy URL, list the source. Used to:
   *   - Generate the 301 redirect entry.
   *   - Render a canonical link tag pointing at the new URL.
   *   - Preserve incoming backlinks (LinkedIn / partner referrals).
   */
  legacyPaths?: string[];

  // ── Growth-future fields (mirror WikiTocEntry — see wiki-toc.ts). ─

  /** Cross-cutting tags (`topic:`, `regulation:`, `audience:`, `sector:`, `type:`, `level:`). */
  tags?: string[];

  /** Soft grouping within a category for the category index UI. */
  subCategory?: string;

  /** Primary sector this page targets, if sector-specific. */
  targetSector?: SectorTag;

  /** Audience roles the page is primarily written for. */
  audience?: AudienceRole[];

  /** ISO 8601 date of last editorial review; drives `Article.dateModified`. */
  lastReviewedAt?: string;
}

/**
 * The registry. Empty until founder approves the first batch.
 *
 * To add entries (after go signal): import the entry array from a
 * batched file in `content/registry-batches/` and spread here. Keeping
 * batches in separate files makes founder review easier (one PR per
 * weekly batch, ~20 entries each).
 */
export const DOCS_PAGES: DocsPageEntry[] = [];

/**
 * Lookup helpers used by `/wiki/[category]/[slug]/page.tsx` and by the
 * sitemap.
 */

export function findDocsPage(
  category: DocsCategory,
  slug: string,
  locale: "de" | "en" | "nl",
): DocsPageEntry | undefined {
  return DOCS_PAGES.find(
    (p) => p.category === category && p.slug === slug && p.locale === locale,
  );
}

export function listDocsPages(filter?: {
  category?: DocsCategory;
  locale?: "de" | "en" | "nl";
  authorSlug?: DocsAuthor["slug"];
}): DocsPageEntry[] {
  return DOCS_PAGES.filter((p) => {
    if (filter?.category && p.category !== filter.category) return false;
    if (filter?.locale && p.locale !== filter.locale) return false;
    if (filter?.authorSlug && p.authorSlug !== filter.authorSlug) return false;
    return true;
  });
}

/**
 * Pages eligible for the sitemap as of `now`. The sitemap.ts handler
 * calls this to drive the gradual ramp described in the architecture
 * doc §4. Pages with `publishedAt` in the future are kept in the
 * registry (so they're buildable) but NOT emitted to the sitemap.
 */
export function listSitemapEligiblePages(now: Date = new Date()): DocsPageEntry[] {
  return DOCS_PAGES.filter((p) => new Date(p.publishedAt) <= now);
}

/**
 * Author byline summary for `/autor/<slug>` profile pages.
 */
export function listArticlesByAuthor(
  authorSlug: DocsAuthor["slug"],
  locale: "de" | "en" | "nl",
): DocsPageEntry[] {
  return listDocsPages({ authorSlug, locale }).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
