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

// Relative imports: next.config.ts loads this file, and its loader resolves no path aliases.
import { ORDER_SLUGS, PRICING_SLUGS, REPLACED_SLUGS } from "../../i18n/slugs";
import { LOCALE_CODES, type LocaleCode } from "../locale";
import {
  docsToWikiRedirects,
  localizedWikiSlugRedirects,
  wikiLegacyRedirects,
} from "./wiki-toc";

export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const localePath = (locale: LocaleCode, slug: string) =>
  locale === "de" ? slug : `/${locale}${slug}`;

/**
 * A route whose slug was translated per locale: the one slug it had everywhere
 * before now 301s to the locale's own, wherever the two differ. Query strings
 * pass through, so an old order or pricing link with parameters still lands.
 */
export const translatedSlugRedirects = (
  replaced: string,
  now: Readonly<Record<LocaleCode, string>>,
): LegacyRedirect[] =>
  LOCALE_CODES.flatMap((locale) =>
    now[locale] === replaced
      ? []
      : [
          {
            source: localePath(locale, replaced),
            destination: localePath(locale, now[locale]),
            permanent: true,
          },
        ],
  );

export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  ...wikiLegacyRedirects(),
  ...docsToWikiRedirects(),
  // pl/ro/fr/it moved off English slugs onto localized ones; the English
  // URLs they were indexed on still have to resolve.
  ...localizedWikiSlugRedirects(),
  // Pricing and the order page got a slug per locale on 30.09.2026.
  ...translatedSlugRedirects(REPLACED_SLUGS.pricing, PRICING_SLUGS),
  ...translatedSlugRedirects(REPLACED_SLUGS.order, ORDER_SLUGS),
];
