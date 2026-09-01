/**
 * Legacy URL → /wiki/<category>/<slug> redirect map.
 *
 * Source of truth for the 301 permanent redirects emitted by
 * next.config.ts when existing info pages migrate under `/wiki`.
 *
 * Why preserve every legacy URL: LinkedIn posts, partner outreach
 * emails, and search-engine backlinks already point to the current
 * paths. Breaking them loses the SEO authority we've built. Every
 * redirect is permanent so search engines transfer link equity.
 *
 * Derived from WIKI_TOC so the migration list and the redirect list
 * cannot drift apart. Each migrated page contributes three entries —
 * one per locale — pointing OLD locale slug → NEW localized /docs path.
 */

import {
  wikiLegacyRedirects,
  docsToWikiRedirects,
  localizedWikiSlugRedirects,
} from "./wiki-toc";

export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  ...wikiLegacyRedirects(),
  ...docsToWikiRedirects(),
  // pl/ro/fr/it moved off English slugs onto localized ones; the English
  // URLs they were indexed on still have to resolve.
  ...localizedWikiSlugRedirects(),
];
