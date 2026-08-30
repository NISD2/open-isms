/**
 * Related articles mapping for internal linking.
 * Each key is a slug (without locale prefix), value is array of related slugs.
 * Used by RelatedArticles component in the info layout.
 *
 * The slugs here are the canonical German ones. Most of these pages have since
 * migrated under /wiki, where every locale has its own slug, so a slug on its
 * own is not a URL. `relatedPathname` turns one into the canonical pathname
 * key that next-intl can localize. See the note on that function for what
 * went wrong when the component built hrefs by hand.
 */
export const relatedArticles: Record<string, string[]> = {
  "what-is-nis2": [
    "nis2-in-germany",
    "nis2-requirements",
    "geschaftsfuhrerhaftung",
    "faq",
  ],
  "nis2-in-germany": [
    "what-is-nis2",
    "nis2-registrierung",
    "it-grundschutz",
    "nis2-bussgelder",
  ],
  "nis2-requirements": [
    "what-is-nis2",
    "nis2-documents",
    "cir-2024-2690",
    "it-grundschutz",
  ],
  "nis2-documents": [
    "nis2-requirements",
    "cir-2024-2690",
    "nis2-meldepflicht",
    "umsetzung-mittelstand",
  ],
  features: [
    "what-is-nis2",
    "pricing",
    "nis2-requirements",
    "nis2-tool",
  ],
  "nis2-tool": [
    "features",
    "nis2-requirements",
    "kosten",
    "what-is-nis2",
  ],
  faq: [
    "what-is-nis2",
    "nis2-registrierung",
    "geschaftsfuhrerhaftung",
    "glossar",
  ],
  geschaftsfuhrerhaftung: [
    "nis2-bussgelder",
    "nis2-in-germany",
    "what-is-nis2",
    "training/nis2-ceo",
  ],
  "nis2-bussgelder": [
    "geschaftsfuhrerhaftung",
    "nis2-registrierung-verpasst",
    "nis2-in-germany",
    "nis2-meldepflicht",
  ],
  "it-grundschutz": [
    "nis2-in-germany",
    "nis2-requirements",
    "nis2-iso-27001",
    "cir-2024-2690",
  ],
  "nis2-registrierung": [
    "nis2-registrierung-verpasst",
    "nis2-umsetzung-europa",
    "nis2-in-germany",
    "nis2-bussgelder",
  ],
  "nis2-registrierung-verpasst": [
    "nis2-registrierung",
    "nis2-bussgelder",
    "geschaftsfuhrerhaftung",
    "nis2-umsetzung-europa",
  ],
  "umsetzung-mittelstand": [
    "what-is-nis2",
    "nis2-requirements",
    "nis2-documents",
    "kosten",
  ],
  kosten: [
    "pricing",
    "umsetzung-mittelstand",
    "features",
    "what-is-nis2",
  ],
  "it-sicherheitspflicht": [
    "nis2-in-germany",
    "nis2-requirements",
    "it-grundschutz",
    "geschaftsfuhrerhaftung",
  ],
  "nis2-europaeischer-standard": [
    "nis2-umsetzung-europa",
    "cir-2024-2690",
    "what-is-nis2",
    "nis2-timeline",
  ],
  "nis2-iso-27001": [
    "it-grundschutz",
    "nis2-requirements",
    "nis2-vs-kritis",
    "cir-2024-2690",
  ],
  "nis2-vs-kritis": [
    "nis2-in-germany",
    "nis2-iso-27001",
    "it-grundschutz",
    "nis2-einrichtungen",
  ],
  "nis2-meldepflicht": [
    "nis2-requirements",
    "nis2-bussgelder",
    "nis2-in-germany",
    "cir-2024-2690",
  ],
  "cir-2024-2690": [
    "nis2-requirements",
    "nis2-documents",
    "it-grundschutz",
    "nis2-meldepflicht",
  ],
  "nis2-umsetzung-europa": [
    "nis2-europaeischer-standard",
    "nis2-timeline",
    "nis2-registrierung",
    "what-is-nis2",
  ],
  "nis2-einrichtungen": [
    "what-is-nis2",
    "nis2-in-germany",
    "nis2-vs-kritis",
    "nis2-requirements",
  ],
  "nis2-timeline": [
    "nis2-umsetzung-europa",
    "what-is-nis2",
    "cir-2024-2690",
    "nis2-registrierung",
  ],
  "nis2-events": [
    "nis2-timeline",
    "nis2-umsetzung-europa",
    "what-is-nis2",
    "nis2-registrierung",
  ],
  glossar: [
    "what-is-nis2",
    "faq",
    "nis2-requirements",
    "nis2-einrichtungen",
  ],
  "nis2-lieferkette": [
    "nis2-requirements",
    "features",
    "nis2-iso-27001",
    "nis2-in-germany",
  ],
  pricing: [
    "features",
    "kosten",
    "what-is-nis2",
  ],
  "training/nis2-ceo": [
    "geschaftsfuhrerhaftung",
    "nis2-gap-assessment",
    "what-is-nis2",
    "nis2-requirements",
  ],
  "nis2-gap-assessment": [
    "what-is-nis2",
    "training/nis2-ceo",
    "nis2-requirements",
    "features",
  ],
  // Sector pages cross-link to each other + core
  "nis2-abfallwirtschaft": [
    "nis2-produzierendes-gewerbe",
    "nis2-einrichtungen",
    "what-is-nis2",
    "nis2-lieferkette",
  ],
  "nis2-gesundheitswesen": [
    "nis2-einrichtungen",
    "nis2-lebensmittel",
    "what-is-nis2",
    "nis2-requirements",
  ],
  "nis2-logistik": [
    "nis2-lieferkette",
    "nis2-produzierendes-gewerbe",
    "nis2-einrichtungen",
    "what-is-nis2",
  ],
  "nis2-lebensmittel": [
    "nis2-gesundheitswesen",
    "nis2-produzierendes-gewerbe",
    "nis2-einrichtungen",
    "what-is-nis2",
  ],
  "nis2-produzierendes-gewerbe": [
    "nis2-abfallwirtschaft",
    "nis2-logistik",
    "nis2-einrichtungen",
    "what-is-nis2",
  ],
};

/**
 * i18n title keys for each slug, used to look up the translated page title.
 * Maps slug → the i18n key prefix that contains a "title" field.
 */
export const pageTitleKeys: Record<string, string> = {
  "what-is-nis2": "whatIsNis2",
  "nis2-in-germany": "nis2InGermany",
  "nis2-requirements": "nis2Requirements",
  "nis2-tool": "nis2Tool",
  "nis2-documents": "nis2Documents",
  features: "features",
  faq: "faq",
  geschaftsfuhrerhaftung: "ceoLiability",
  "nis2-bussgelder": "penalties",
  "it-grundschutz": "grundschutz",
  "nis2-registrierung": "registration",
  "nis2-registrierung-verpasst": "missedRegistration",
  "umsetzung-mittelstand": "smeGuide",
  kosten: "costs",
  "it-sicherheitspflicht": "securityObligation",
  "bsig-30": "bsigParagraph30",
  "nis2-europaeischer-standard": "europeanStandard",
  "nis2-iso-27001": "isoMapping",
  "nis2-vs-kritis": "kritisComparison",
  "nis2-meldepflicht": "incidentReporting",
  "cir-2024-2690": "cirGuide",
  "nis2-umsetzung-europa": "euImplementation",
  "nis2-einrichtungen": "entityTypes",
  "nis2-timeline": "nis2Timeline",
  "nis2-events": "nis2Events",
  glossar: "glossary",
  "nis2-lieferkette": "supplyChainCompliance",
  pricing: "features",
  "training/nis2-ceo": "trainingPortal",
  "nis2-gap-assessment": "gapAssessment",
  "nis2-abfallwirtschaft": "sectorWaste",
  "nis2-gesundheitswesen": "sectorHealth",
  "nis2-logistik": "sectorLogistics",
  "nis2-lebensmittel": "sectorFood",
  "nis2-produzierendes-gewerbe": "sectorManufacturing",
};

import { routing } from "@/i18n/routing";
import { WIKI_TOC, WIKI_TOP_LEVEL } from "@/lib/content/wiki-toc";

/**
 * A pathname the next-intl routing config can localize from the key alone.
 *
 * Parameterised routes (`/newsletter/[slug]`) are excluded: <Link> needs a
 * `params` object for those, so a bare key is not a usable href. No related
 * article is a dynamic route, and the exclusion keeps that true by construction.
 */
export type AppPathname = Exclude<
  keyof typeof routing.pathnames,
  `${string}[${string}]${string}`
>;

/**
 * Canonical (German) wiki slug -> the pathname key `wikiPathnames()` registers
 * for it. Built from WIKI_TOC, the same source that produces the routing map,
 * so the two cannot drift.
 */
const WIKI_SLUG_TO_PATHNAME: ReadonlyMap<string, string> = new Map(
  WIKI_TOP_LEVEL.flatMap((cat) =>
    WIKI_TOC[cat].entries.map(
      (entry) => [entry.slug, `/wiki/${cat}/${entry.slug}`] as const,
    ),
  ),
);

/**
 * Resolve a related-articles slug to a registered pathname, or null when it
 * points at nothing we can link to.
 *
 * WHY THIS EXISTS. RelatedArticles used to render `href={`/${slug}` as never}`.
 * The cast silenced the typed-route check, and next-intl, given a pathname it
 * does not know, falls back to prefixing the locale verbatim. So the German
 * slug came out as /en/kosten and /nl/what-is-nis2: URLs that are neither a
 * registered route nor a legacy redirect (those exist only for each locale's
 * OWN old slug), leaving them to the proxy's protected-by-default branch. 28
 * of 32 slugs were broken in at least one locale, on every info page in the
 * site's footer-adjacent related block.
 *
 * Returning null rather than a guess means a slug that no longer resolves
 * renders no card, instead of a link that 404s or bounces to sign-in.
 */
export function relatedPathname(slug: string): AppPathname | null {
  const candidates = [`/${slug}`, WIKI_SLUG_TO_PATHNAME.get(slug)];
  for (const candidate of candidates) {
    // The `in` check is the narrowing: only keys the routing config actually
    // carries are returned, so the assertion below cannot outrun reality.
    if (
      candidate &&
      !candidate.includes("[") &&
      candidate in routing.pathnames
    ) {
      return candidate as AppPathname;
    }
  }
  return null;
}
