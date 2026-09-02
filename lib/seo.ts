import { routing } from "@/i18n/routing";
import { ogCard } from "./og-card";

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nisd2.eu";

export type Locale = (typeof routing.locales)[number];

/**
 * Resolves a canonical pathname (the key in routing.pathnames) to its
 * locale-specific URL slug. Falls back to the canonical path if the route
 * is not registered or unlocalized.
 */
function localizedSlug(canonicalPath: string, locale: Locale): string {
  const entry = (routing.pathnames as Record<string, unknown>)[canonicalPath];
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object") {
    return (entry as Record<Locale, string>)[locale] ?? canonicalPath;
  }
  return canonicalPath;
}

/**
 * Builds an absolute URL for a canonical pathname under the given locale,
 * honouring routing.pathnames. Used by sitemap, hreflang alternates,
 * and JSON-LD URL fields. Single source of truth for locale-aware URLs.
 */
export function localizedAbsoluteUrl(
  canonicalPath: string,
  locale: Locale,
): string {
  const slug = localizedSlug(canonicalPath, locale);
  if (locale === routing.defaultLocale) {
    return slug === "/" ? baseUrl : `${baseUrl}${slug}`;
  }
  return slug === "/" ? `${baseUrl}/${locale}` : `${baseUrl}/${locale}${slug}`;
}

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Locales the help offer actually exists in.
 *
 * messages/help/ ships de, en and nl only. i18n/request.ts falls back to
 * English for an absent namespace, so /es/ayuda serves English prose under a
 * URL that claims to be Spanish. Advertising all ten with reciprocal hreflang
 * told Google that eight of them were translations of each other when they are
 * one English page repeated, which is the shape of duplicate content it
 * penalises.
 *
 * /vermittlung is the sharper case: it states the 15 percent commission,
 * liability limits and data-transfer consent. Offering that as an es/fr/it/
 * pl/cs/pt/ro document when it is English is not a translation gap, it is a
 * legal page presented as something it is not.
 *
 * It lives here rather than in app/sitemap.ts because the sitemap is only half
 * of the claim: pageAlternates writes the <head> hreflang set, and Google reads
 * the two together. A list narrowed in one place and not the other produces
 * non-reciprocal hreflang, which is worse than either choice made consistently.
 * Both readers take this constant, so widening it to a newly translated locale
 * is a one-line change that moves both at once.
 *
 * The two are unified in WHICH locales they name, not yet in shape: sitemap
 * entries carry no x-default and the <head> set does. That asymmetry predates
 * this constant and applies to every page on the site, so it is left for a
 * change that can move all of them together.
 *
 * The routes still resolve in every locale, so an existing link keeps working;
 * they are simply no longer advertised as translations.
 */
export const HELP_LOCALES = ["de", "en", "nl"] as const;

/**
 * The locale every other one degrades to. i18n/request.ts loads a missing
 * namespace file from en, then fills any key still absent from the English
 * messages, so a page in an untranslated locale is serving the English one.
 * That makes en the canonical target for those URLs, not routing.defaultLocale.
 */
const I18N_FALLBACK_LOCALE: Locale = "en";

/**
 * Returns canonical + hreflang alternates for a page.
 *
 * `slug` is the legacy slug-without-leading-slash form (e.g. "nis2-bussgelder",
 * or "" for the homepage). It is converted to a canonical pathname (with
 * leading slash) and resolved per locale via the routing config.
 *
 * Emits hreflang for every configured locale + x-default → DE root. The
 * `x-default` value is what Google serves when no locale match is
 * found, so we point it at DE (our primary market).
 *
 * `locales` narrows that set for a page that does not exist in all of them --
 * see HELP_LOCALES above. It must be passed the same list the sitemap uses for
 * that page, or the two disagree and the hreflang stops being reciprocal.
 */
export function pageAlternates(
  slug: string,
  locale: string,
  locales: readonly Locale[] = routing.locales,
) {
  const canonical = slug ? `/${slug}` : "/";
  const safeLocale: Locale = isLocale(locale) ? locale : routing.defaultLocale;

  // A locale outside `locales` still resolves -- the route exists in all ten
  // and i18n/request.ts fills the namespace from English -- so what it serves
  // is the English page under a localized URL. It says exactly that: one
  // canonical pointing at the English original, and no hreflang set of its
  // own. Emitting the narrowed cluster here instead would name three URLs and
  // omit this page from its own annotation, which is the invalid shape Google
  // discards the whole set for, and dropping it from the sitemap alone never
  // stopped it being crawled: PricingCards and /vermittlung link /hilfe in
  // every locale, and layout.tsx indexes everything by default.
  if (!locales.includes(safeLocale)) {
    return { canonical: localizedAbsoluteUrl(canonical, I18N_FALLBACK_LOCALE) };
  }

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = localizedAbsoluteUrl(canonical, l);
  }
  // x-default has to name a locale that is in the set it heads.
  const fallback = locales.includes(routing.defaultLocale)
    ? routing.defaultLocale
    : I18N_FALLBACK_LOCALE;
  languages["x-default"] = localizedAbsoluteUrl(canonical, fallback);
  return {
    canonical: localizedAbsoluteUrl(canonical, safeLocale),
    languages,
  };
}

/** Absolute URL for a page in a given locale. */
export function pageUrl(slug: string, locale: string): string {
  const canonical = slug ? `/${slug}` : "/";
  const safeLocale: Locale = isLocale(locale) ? locale : routing.defaultLocale;
  return localizedAbsoluteUrl(canonical, safeLocale);
}

const OG_LOCALE: Record<Locale, string> = {
  de: "de_DE",
  en: "en_US",
  nl: "nl_NL",
  fr: "fr_FR",
  it: "it_IT",
  es: "es_ES",
  pl: "pl_PL",
  cs: "cs_CZ",
  pt: "pt_PT",
  ro: "ro_RO",
};

/**
 * Returns a Next.js `Metadata` OpenGraph + Twitter Cards block with
 * sensible defaults for any page on the site. Locale-aware: emits
 * `og:locale` for the current locale and `og:locale:alternate` for
 * the other two.
 *
 * Image defaults to /og-default.png (1200x630). Pages with their own
 * OG image (wiki articles, specific landing pages) override via the
 * `image` arg.
 */
export function pageOg(args: {
  slug: string;
  locale: string;
  title: string;
  description: string;
  type?:
    | "website"
    | "article"
    | "profile"
    | "product.group"
    | "book";
  image?: string;
  imageAlt?: string;
  twitterHandle?: string;
}) {
  const safeLocale: Locale = isLocale(args.locale) ? args.locale : routing.defaultLocale;
  const url = pageUrl(args.slug, safeLocale);
  const alternates: string[] = routing.locales
    .filter((l) => l !== safeLocale)
    .map((l) => OG_LOCALE[l]);
  const card = args.image ?? ogCard(args.slug, safeLocale);
  const image = card
    ? card.startsWith("http")
      ? card
      : `${baseUrl}${card}`
    : `${baseUrl}/og-default.png`;

  return {
    openGraph: {
      title: args.title,
      description: args.description,
      url,
      type: args.type ?? "website",
      siteName: "NISD2",
      locale: OG_LOCALE[safeLocale],
      alternateLocale: alternates,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: args.imageAlt ?? args.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: args.title,
      description: args.description,
      images: [image],
      ...(args.twitterHandle ? { creator: args.twitterHandle } : {}),
    },
  };
}

/**
 * Builds a SiteNavigationElement JSON-LD block for a navigation
 * block (header nav or footer column). Each item gets a name + URL.
 * Used by the root layout to give Google a clean view of the site's
 * information architecture (header nav and footer columns).
 */
export function buildSiteNavigationJsonLd(args: {
  name: string;
  items: Array<{ name: string; url: string }>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "@id": `${baseUrl}/#nav-${args.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: args.name,
    hasPart: args.items.map((item) => ({
      "@type": "WebPage",
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Builds the site-wide @graph of SiteNavigationElement blocks for
 * the current locale. Includes the header nav and the 4 footer
 * columns. URLs resolve through routing.pathnames so each locale
 * gets the right localized slugs.
 */
export function buildSiteNavGraphJsonLd(locale: Locale): Record<string, unknown> {
  const u = (slug: string) => localizedAbsoluteUrl(slug, locale);
  const isEn = locale === "en";

  const header = buildSiteNavigationJsonLd({
    name: "Main navigation",
    items: [
      { name: "Wiki", url: u("/wiki") },
      { name: isEn ? "Pricing" : "Preise", url: u("/pricing") },
      { name: isEn ? "About" : "Über uns", url: u("/about") },
      { name: isEn ? "Sign in" : "Anmelden", url: u("/auth/signin") },
    ],
  });

  const platform = buildSiteNavigationJsonLd({
    name: "Footer — Platform",
    items: [
      { name: "Wiki", url: u("/wiki") },
      { name: isEn ? "Features" : "Funktionen", url: u("/features") },
      { name: isEn ? "Pricing" : "Preise", url: u("/pricing") },
      { name: isEn ? "Sign in" : "Anmelden", url: u("/auth/signin") },
      { name: isEn ? "CEO training" : "CEO-Kurs", url: u("/training/nis2-ceo") },
    ],
  });

  const company = buildSiteNavigationJsonLd({
    name: "Footer — Company",
    items: [
      { name: isEn ? "Trust Center" : "Vertrauenscenter", url: u("/vertrauen") },
      { name: isEn ? "Mission" : "Mission", url: u("/mission") },
      { name: isEn ? "Team" : "Team", url: u("/about") },
      { name: isEn ? "Corrections" : "Korrekturen", url: u("/corrections") },
      { name: isEn ? "Changelog" : "Changelog", url: u("/changelog") },
      { name: "Open source", url: u("/open-source") },
      { name: "Status", url: u("/status") },
    ],
  });

  const legal = buildSiteNavigationJsonLd({
    name: "Footer — Legal",
    items: [
      { name: isEn ? "Imprint" : "Impressum", url: u("/impressum") },
      { name: isEn ? "Privacy" : "Datenschutz", url: u("/datenschutz") },
      { name: "DPA / AVV", url: u("/avv") },
      { name: "TOMs", url: u("/toms") },
      { name: isEn ? "Terms" : "Nutzungsbedingungen", url: u("/terms") },
    ],
  });

  return {
    "@context": "https://schema.org",
    "@graph": [header, platform, company, legal],
  };
}

/**
 * BreadcrumbList builder for any page (wiki or non-wiki). Items must
 * include the homepage as position 1 by convention.
 */
export function buildBreadcrumbListJsonLd(
  items: Array<{ name: string; url: string }>,
  id?: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    ...(id ? { "@id": id } : {}),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

export function articleJsonLd(args: {
  slug: string;
  locale: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
}) {
  const url = pageUrl(args.slug, args.locale);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title,
    description: args.description,
    url,
    inLanguage: args.locale,
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: { "@type": "Organization", name: "nisd2.eu", url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: "nisd2.eu",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; slug: string }[],
  locale: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: pageUrl(item.slug, locale),
    })),
  };
}

// ── Docs hub builders ────────────────────────────────────────────────
// New builders for the /docs content sweep (2026-05-29). Keep the
// existing articleJsonLd/breadcrumbJsonLd above untouched — they are
// still consumed by the legacy info pages. These builders embed a
// Person byline (Simon / Cory) and the schema.org subtype variants
// the docs categories need.

import {
  authorPersonSchema,
  type DocsAuthor,
} from "@/lib/content/authors";
import type { DocsCategory } from "@/lib/content/content-types";

const LOCALE_BCP47: Record<Locale, string> = {
  de: "de-DE",
  en: "en-GB",
  nl: "nl-NL",
  fr: "fr-FR",
  it: "it-IT",
  es: "es-ES",
  pl: "pl-PL",
  cs: "cs-CZ",
  pt: "pt-PT",
  ro: "ro-RO",
};

function docsPublisher() {
  return {
    "@type": "Organization" as const,
    name: "NISD2",
    url: baseUrl,
    logo: { "@type": "ImageObject" as const, url: `${baseUrl}/icon.png` },
  };
}

interface DocsCommonInput {
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorSlug: DocsAuthor["slug"];
  locale: Locale;
  image?: string;
  about?: Array<{ name: string; sameAs?: string }>;
  category: DocsCategory;
}

function docsArticleBase(input: DocsCommonInput) {
  return {
    "@context": "https://schema.org" as const,
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: authorPersonSchema(input.authorSlug, baseUrl),
    publisher: docsPublisher(),
    mainEntityOfPage: { "@type": "WebPage" as const, "@id": input.url },
    inLanguage: LOCALE_BCP47[input.locale],
    articleSection: input.category,
    ...(input.image ? { image: input.image } : {}),
    ...(input.about?.length
      ? {
          about: input.about.map((t) => ({
            "@type": "Thing" as const,
            name: t.name,
            ...(t.sameAs ? { sameAs: t.sameAs } : {}),
          })),
        }
      : {}),
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };
}

/** Article JSON-LD for scope, field, problem, ISO 27001 bridge, CRA, comparison. */
export function buildArticleJsonLd(input: DocsCommonInput): Record<string, unknown> {
  return { "@type": "Article", ...docsArticleBase(input) };
}

// ── TechArticle: the canonical wiki page schema ───────────────────────
// Per the 2026 schema.org + Ahrefs research, TechArticle (not Article)
// is what wiki pages should emit. Covers technical/legal content,
// supports proficiencyLevel + audience, drives AI Overview citations
// when paired with Legislation references. See
// sales/research/wiki-seo-template-2026-05-29.md for the spec.

export interface TechArticleInput {
  /** Canonical wiki path under /wiki, e.g. "wiki/recht-und-folgen/nis2-bussgelder". */
  slug: string;
  locale: Locale;
  /** Headline = title tag content (45-55 chars DE, 50-60 EN). */
  headline: string;
  /** Longer-tail title variant for AI Overviews. Distinct from headline. */
  alternativeHeadline?: string;
  /** Meta description (≤150 DE, ≤155 EN). */
  description: string;
  /** Distinct from description — AI Overviews quote this preferentially. */
  abstract?: string;
  /** ISO 8601 timestamp when first published. */
  datePublished: string;
  /** ISO 8601 timestamp of last review. Defaults to datePublished. */
  dateModified?: string;
  /** Author byline. Person @id resolved from the author slug. */
  authorPersonId: string;
  /** Optional image URL (absolute or path under /). 1200x630 OG aspect. */
  image?: string;
  /** Top-level wiki category, e.g. "Sektoren", "Recht und Folgen". */
  articleSection: string;
  /** Word count of articleBody. Drives "long-form authority" signal. */
  wordCount?: number;
  /** Keywords this article targets (5-8). */
  keywords?: string[];
  /** TechArticle-specific: target reader skill level. */
  proficiencyLevel?: "Beginner" | "Intermediate" | "Expert";
  /** TechArticle-specific: prerequisite knowledge in plain language. */
  dependencies?: string;
  /** Target audience description (e.g. "Geschäftsführer mittelständischer Stadtwerke"). */
  audienceType?: string;
  /** Country the audience operates in. */
  audienceCountry?: string;
  /** Legislation @ids that this article is fundamentally about. */
  aboutLegislationIds?: string[];
  /** Legislation @ids merely mentioned. */
  mentionsLegislationIds?: string[];
  /** Legislation @ids formally cited. Drives primary-source authority. */
  citationLegislationIds?: string[];
  /** Breadcrumb @id for this page. */
  breadcrumbId?: string;
}

const SPEAKABLE_SELECTORS = ["h1", "header p", ".lead", ".tldr"];

/** TechArticle JSON-LD — the canonical builder for wiki content pages. */
export function buildTechArticleJsonLd(input: TechArticleInput): Record<string, unknown> {
  const pageUrl = `${baseUrl}/${input.slug}`;
  const articleId = `${pageUrl}#article`;
  const buildDate = new Date().toISOString().slice(0, 10);

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": articleId,
    isPartOf: { "@id": `${baseUrl}/#website` },
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { "@id": input.authorPersonId },
    publisher: { "@id": `${baseUrl}/#organization` },
    inLanguage: LOCALE_BCP47[input.locale],
    articleSection: input.articleSection,
    license: "https://creativecommons.org/licenses/by-sa/4.0/",
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: SPEAKABLE_SELECTORS,
    },
    sdPublisher: { "@id": `${baseUrl}/#organization` },
    sdDatePublished: buildDate,
    sdLicense: "https://creativecommons.org/licenses/by-sa/4.0/",
  };

  if (input.alternativeHeadline) node.alternativeHeadline = input.alternativeHeadline;
  if (input.abstract) node.abstract = input.abstract;
  if (input.image) {
    const imageUrl = input.image.startsWith("http") ? input.image : `${baseUrl}${input.image}`;
    node.image = {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    };
  }
  if (input.wordCount !== undefined) node.wordCount = input.wordCount;
  if (input.keywords?.length) node.keywords = input.keywords;
  if (input.proficiencyLevel) node.proficiencyLevel = input.proficiencyLevel;
  if (input.dependencies) node.dependencies = input.dependencies;
  if (input.audienceType) {
    node.audience = {
      "@type": "Audience",
      audienceType: input.audienceType,
      ...(input.audienceCountry
        ? { geographicArea: { "@type": "Country", name: input.audienceCountry } }
        : {}),
    };
  }
  if (input.aboutLegislationIds?.length) {
    node.about = input.aboutLegislationIds.map((id) => ({ "@id": id }));
  }
  if (input.mentionsLegislationIds?.length) {
    node.mentions = input.mentionsLegislationIds.map((id) => ({ "@id": id }));
  }
  if (input.citationLegislationIds?.length) {
    node.citation = input.citationLegislationIds.map((id) => ({ "@id": id }));
  }
  if (input.breadcrumbId) node.breadcrumb = { "@id": input.breadcrumbId };

  return node;
}

/**
 * Site-wide @graph emitted in the root layout on every page.
 *
 * Contains the brand entities (WebSite + Organization) only. These
 * belong on every page because every page represents the brand.
 *
 * Persons (Simon, Cory) are NOT declared here. They are author
 * identities, not site-wide entities. They are declared in full only
 * on their /autor/<slug> profile pages, and referenced by @id from
 * TechArticle.author inside wiki article pages. Pages outside the
 * wiki (homepage, pricing, applicability, auth) have no concept of
 * authorship, so they should not carry Person nodes.
 *
 * Organization.founder still references the Person @ids — Google
 * resolves the references by crawling the /autor pages.
 */
export function buildSiteGraphJsonLd(_locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: `${baseUrl}/`,
        name: "NISD2",
        alternateName: ["NIS 2 Wiki", "nisd2.eu"],
        inLanguage: routing.locales.map((l) => LOCALE_BCP47[l]),
        publisher: { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "NISD2",
        legalName: "Kardashev Catalyst UG (haftungsbeschränkt)",
        url: `${baseUrl}/`,
        logo: {
          "@type": "ImageObject" as const,
          url: `${baseUrl}/icon.png`,
          width: 512,
          height: 512,
        },
        foundingDate: "2026-03-11",
        email: "contact@nisd2.eu",
        knowsAbout: [
          "NIS 2 Directive (EU) 2022/2555",
          "BSIG",
          "BSI-KritisV",
          "CIR 2024/2690",
          "IT-Grundschutz",
          "ISO 27001:2022",
          "ENISA Technical Implementation Guidance",
          "Cyber Resilience Act",
        ],
        knowsLanguage: [...routing.locales],
        areaServed: { "@type": "Place" as const, name: "European Union" },
        sameAs: [
          "https://www.linkedin.com/company/nisd2",
          "https://github.com/NISD2",
        ],
        publishingPrinciples: `${baseUrl}/redaktion`,
        ethicsPolicy: `${baseUrl}/ethik`,
        correctionsPolicy: `${baseUrl}/corrections`,
        ownershipFundingInfo: `${baseUrl}/finanzierung`,
        founder: [
          { "@id": `${baseUrl}/autor/simon-orzel#person` },
          { "@id": `${baseUrl}/autor/cory-hisey#person` },
        ],
      },
    ],
  };
}

/** Convenience BreadcrumbList builder for wiki pages. */
export function buildWikiBreadcrumbJsonLd(input: {
  slug: string;
  categorySlug: string;
  categoryName: string;
  pageName: string;
}): Record<string, unknown> {
  const pageUrl = `${baseUrl}/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Wiki", item: `${baseUrl}/wiki` },
      {
        "@type": "ListItem",
        position: 2,
        name: input.categoryName,
        item: `${baseUrl}/wiki/${input.categorySlug}`,
      },
      { "@type": "ListItem", position: 3, name: input.pageName, item: pageUrl },
    ],
  };
}

export interface DefinedTermInput extends DocsCommonInput {
  termName: string;
  termDefinition: string;
  /** EU article URL or other primary source (optional). */
  sourceUrl?: string;
}

/** DefinedTerm JSON-LD for glossary entries. */
export function buildDefinedTermJsonLd(input: DefinedTermInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": input.url,
    name: input.termName,
    description: input.termDefinition,
    inDefinedTermSet: `${baseUrl}/wiki/glossar`,
    inLanguage: LOCALE_BCP47[input.locale],
    ...(input.sourceUrl ? { url: input.sourceUrl } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
}

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export interface HowToInput extends DocsCommonInput {
  /** ISO 8601 duration, e.g. "PT30M" or "P1D". */
  totalTime?: string;
  estimatedCost?: { currency: "EUR"; value: number };
  steps: HowToStep[];
  tools?: string[];
}

/** HowTo JSON-LD for step-by-step implementation guides. */
export function buildHowToJsonLd(input: HowToInput): Record<string, unknown> {
  return {
    "@type": "HowTo",
    ...docsArticleBase(input),
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.estimatedCost
      ? {
          estimatedCost: {
            "@type": "MonetaryAmount" as const,
            currency: input.estimatedCost.currency,
            value: input.estimatedCost.value,
          },
        }
      : {}),
    ...(input.tools?.length
      ? {
          tool: input.tools.map((t) => ({
            "@type": "HowToTool" as const,
            name: t,
          })),
        }
      : {}),
    step: input.steps.map((s, idx) => ({
      "@type": "HowToStep" as const,
      position: idx + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

export interface FAQEntry {
  question: string;
  answer: string;
}

/** FAQPage JSON-LD for problem/panic pages that carry Q&A pairs. */
export function buildFaqPageJsonLd(input: {
  url: string;
  entries: FAQEntry[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": input.url,
    mainEntity: input.entries.map((e) => ({
      "@type": "Question" as const,
      name: e.question,
      acceptedAnswer: { "@type": "Answer" as const, text: e.answer },
    })),
  };
}

/**
 * SoftwareApplication JSON-LD for product surfaces (pricing / features).
 * Embeds a free Offer so Google understands price = 0. Provider is
 * referenced by @id to the Organization node from buildSiteGraphJsonLd.
 */
export function buildSoftwareApplicationJsonLd(input: {
  slug: string;
  locale: Locale;
  name: string;
  description: string;
  featureList?: string[];
  category?: string;
}): Record<string, unknown> {
  const url = localizedAbsoluteUrl(`/${input.slug}`, input.locale);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: input.name,
    description: input.description,
    url,
    applicationCategory: input.category ?? "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: input.locale,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url,
    },
    provider: { "@id": `${baseUrl}/#organization` },
    ...(input.featureList && input.featureList.length > 0
      ? { featureList: input.featureList }
      : {}),
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
  };
}

/**
 * AboutPage JSON-LD for /about and /mission. References the main entity
 * (the Organization) so Google understands this page describes the
 * publisher itself.
 */
export function buildAboutPageJsonLd(input: {
  slug: string;
  locale: Locale;
  name: string;
  description: string;
}): Record<string, unknown> {
  const url = localizedAbsoluteUrl(`/${input.slug}`, input.locale);
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#aboutpage`,
    name: input.name,
    description: input.description,
    url,
    inLanguage: input.locale,
    isPartOf: { "@id": `${baseUrl}/#website` },
    mainEntity: { "@id": `${baseUrl}/#organization` },
  };
}
