import { isNotNull } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import languageCopies from "@/lib/content/sitemap-language-copies.json";
import { wikiSitemapPaths } from "@/lib/content/wiki-toc";
import { db } from "@/lib/db";
import { DOCS_REVISED, docsUrl } from "@/lib/docs/seo";
import { DOCS_ENTRIES } from "@/lib/docs/toc";
import { HELP_LOCALES, type Locale, localizedAbsoluteUrl } from "@/lib/seo";
import { newsletterIssue } from "@/schema";

// Rendered at request time, not at build. The published-issue lookup hits the
// database, which is not reachable during the CI/production build step; a
// static prerender would fail with ECONNREFUSED. force-dynamic defers it to
// request time (DB available) and keeps the sitemap fresh as issues publish.
export const dynamic = "force-dynamic";

type SitemapEntry = MetadataRoute.Sitemap[number];

interface PageOptions {
  lastModified?: string;
  changeFrequency?: SitemapEntry["changeFrequency"];
  priority?: number;
  /** Locales this page should appear in. Defaults to all configured locales. */
  locales?: readonly Locale[];
}

/**
 * Generates a sitemap entry per locale for a public-facing canonical path,
 * with hreflang alternates wired up for SEO.
 */
function multilingualEntries(
  canonicalPath: string,
  options: PageOptions = {},
): SitemapEntry[] {
  const locales = options.locales ?? routing.locales;
  // Partial, not Record: `locales` is narrowed for a page that does not exist
  // in all ten (HELP_LOCALES), so asserting a complete record here would let
  // urlPerLocale["es"] typecheck as string and emit `url: undefined`.
  const urlPerLocale = Object.fromEntries(
    locales.map((l) => [l, localizedAbsoluteUrl(canonicalPath, l)]),
  ) as Partial<Record<Locale, string>>;

  const base = {
    lastModified: options.lastModified ?? "2026-05-10",
    changeFrequency: options.changeFrequency ?? ("monthly" as const),
    priority: options.priority ?? 0.7,
  };

  return locales.map((locale) => ({
    url: localizedAbsoluteUrl(canonicalPath, locale),
    ...base,
    alternates: { languages: urlPerLocale },
  }));
}

/**
 * The developer documentation at /docs. One URL per page, no locale segment
 * and no hreflang alternates: those pages are English only and live outside
 * the localized route tree, so a per-locale entry would advertise ten URLs
 * for one document.
 */
function docsEntries(): SitemapEntry[] {
  return [
    { url: docsUrl(), priority: 0.7 },
    ...DOCS_ENTRIES.map((entry) => ({ url: docsUrl(entry.path), priority: 0.5 })),
  ].map(({ url, priority }) => ({
    url,
    lastModified: DOCS_REVISED,
    changeFrequency: "monthly" as const,
    priority,
  }));
}

/** Single-locale entry (for legal pages or locale-restricted content). */
function singleLocaleEntry(
  canonicalPath: string,
  locale: Locale,
  options: PageOptions = {},
): SitemapEntry {
  return {
    url: localizedAbsoluteUrl(canonicalPath, locale),
    lastModified: options.lastModified ?? "2026-05-10",
    changeFrequency: options.changeFrequency ?? ("monthly" as const),
    priority: options.priority ?? 0.3,
  };
}

/**
 * The day a language's pages last changed in a way a crawler should notice. The page entries
 * carry their own review dates, which say nothing about a translation that was rewritten
 * afterwards: Czech became a full language on 15.10.2026, after Google's only crawl of it.
 */
const LOCALE_REWRITTEN_ON: Partial<Record<Locale, string>> = { cs: "2026-10-15" };

const pathOf = (url: string) => new URL(url).pathname;

/**
 * URLs whose text is a copy of the English or German page, as measured by
 * scripts/measure-language-copies.ts. Listing one tells Google there is a page in that
 * language and Google finds the same text it already has, which is the "duplicate" and
 * "crawled, not indexed" it reports for those URLs.
 */
const COPIED_PATHS: ReadonlySet<string> = new Set(Object.keys(languageCopies.copies));

const rewrittenOn = (url: string): string | undefined =>
  Object.entries(LOCALE_REWRITTEN_ON).find(
    ([locale]) => pathOf(url).split("/")[1] === locale,
  )?.[1];

const latest = (a: SitemapEntry["lastModified"], b: string) =>
  a && String(a) > b ? a : b;

export function listOnlyOwnText(
  entries: MetadataRoute.Sitemap,
  copies: ReadonlySet<string> = COPIED_PATHS,
): MetadataRoute.Sitemap {
  const isCopy = (url: string) => copies.has(pathOf(url));
  return entries
    .filter((entry) => !isCopy(entry.url))
    .map((entry) => {
      const languages = entry.alternates?.languages;
      const rewritten = rewrittenOn(entry.url);
      return {
        ...entry,
        ...(rewritten ? { lastModified: latest(entry.lastModified, rewritten) } : {}),
        ...(languages
          ? {
              alternates: {
                languages: Object.fromEntries(
                  Object.entries(languages).filter(([, url]) => !isCopy(String(url))),
                ),
              },
            }
          : {}),
      };
    });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return listOnlyOwnText(await allSitemapEntries());
}

/** Every page in every language the routes serve, before copies are taken out. */
export async function allSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  // Published newsletter issues — only those with publishedAt set are public.
  // Degrade to an empty list if the DB is unreachable so the rest of the
  // sitemap (all the static routes) still renders.
  let publishedIssues: { slug: string; publishedAt: Date | null }[] = [];
  try {
    publishedIssues = await db
      .select({ slug: newsletterIssue.slug, publishedAt: newsletterIssue.publishedAt })
      .from(newsletterIssue)
      .where(isNotNull(newsletterIssue.publishedAt));
  } catch {
    publishedIssues = [];
  }

  return [
    // Homepage + applicability (highest priority, all locales)
    ...multilingualEntries("/", {
      changeFrequency: "weekly",
      priority: 1.0,
    }),
    ...multilingualEntries("/applicability", {
      changeFrequency: "monthly",
      priority: 0.9,
    }),
    ...multilingualEntries("/risikobewertung", {
      changeFrequency: "monthly",
      priority: 0.9,
    }),
    ...multilingualEntries("/strukturanalyse", {
      changeFrequency: "monthly",
      priority: 0.9,
    }),

    // /docs hub + 8 category indexes + all migrated pages — auto-generated from docs-toc
    ...wikiSitemapPaths().flatMap(({ path, priority, lastModified, locales }) =>
      multilingualEntries(path, { priority, lastModified, locales }),
    ),

    // Wiki citation library
    ...multilingualEntries("/wiki/zitate", { priority: 0.6 }),

    // Author profile pages
    ...multilingualEntries("/autor/simon-orzel", { priority: 0.6 }),
    ...multilingualEntries("/autor/cory-hisey", { priority: 0.6 }),

    // News-media trust pages
    ...multilingualEntries("/redaktion", { priority: 0.4 }),
    ...multilingualEntries("/ethik", { priority: 0.4 }),
    ...multilingualEntries("/finanzierung", { priority: 0.4 }),

    // Other public pages
    ...multilingualEntries("/nis2-tool", { priority: 0.9 }),
    ...multilingualEntries("/features", { priority: 0.9 }),

    ...multilingualEntries("/nis2-lieferanten-fragebogen", { priority: 0.8 }),
    ...multilingualEntries("/nis2-meldepflicht-schema", { priority: 0.8 }),
    // Sicherheitsfragebogen wedge — canonical home for the EMD
    // sicherheitsfragebogen.de, which 301s here. High priority because it's
    // the primary entry point for the supplier-portal funnel.
    ...multilingualEntries("/sicherheitsfragebogen", { priority: 0.9 }),
    // Supplier portal product lander — the other half of the supply-chain
    // funnel, and the destination of the landing page's supplier door.
    ...multilingualEntries("/supplier-portal", { priority: 0.9 }),

    // Public newsletter archive + every published issue permalink
    ...multilingualEntries("/newsletter", { changeFrequency: "weekly", priority: 0.6 }),
    ...publishedIssues.flatMap((issue) =>
      multilingualEntries(`/newsletter/${issue.slug}`, {
        changeFrequency: "yearly",
        priority: 0.6,
        lastModified: issue.publishedAt?.toISOString().slice(0, 10),
      }),
    ),

    // Pricing + Training
    ...multilingualEntries("/pricing", { priority: 0.9 }),
    ...multilingualEntries("/hilfe", {
      lastModified: "2026-09-02",
      priority: 0.8,
      locales: HELP_LOCALES,
    }),
    ...multilingualEntries("/vermittlung", {
      lastModified: "2026-09-02",
      priority: 0.4,
      locales: HELP_LOCALES,
    }),
    ...multilingualEntries("/kurse", { priority: 0.8 }),
    ...multilingualEntries("/training/nis2-ceo", { priority: 0.9 }),

    // About + open-source. /pitch and /mission are 308-redirects to /about,
    // so excluded from the sitemap to avoid Google indexing chains.
    ...multilingualEntries("/about", { priority: 0.5 }),
    ...multilingualEntries("/open-source", { priority: 0.5 }),
    ...multilingualEntries("/partner", { priority: 0.4 }),

    // Trust Center
    ...multilingualEntries("/vertrauen", { priority: 0.6 }),
    ...multilingualEntries("/sicherheit", { priority: 0.5 }),
    ...multilingualEntries("/subprozessoren", { priority: 0.5 }),

    // Developer documentation, English only
    ...docsEntries(),

    // Legal pages — DE only by convention (local boilerplate)
    singleLocaleEntry("/terms", "de", {}),
    singleLocaleEntry("/impressum", "de", {}),
    singleLocaleEntry("/datenschutz", "de", {}),
    singleLocaleEntry("/avv", "de", {}),
    singleLocaleEntry("/toms", "de", {}),
  ];
}
