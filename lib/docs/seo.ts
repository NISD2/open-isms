import type { Metadata } from "next";
import { baseUrl } from "@/lib/seo";
import { DOCS_ENTRIES, type DocsEntry } from "./toc";

/**
 * Metadata and structured data for /docs.
 *
 * Separate from lib/seo.ts rather than added to it: every builder there takes
 * a locale and resolves URLs through next-intl's pathname map, because it
 * serves pages that exist ten times over. These pages exist once. Passing a
 * locale into helpers for an English-only tree would mean either a fake
 * argument at every call site or ten canonical URLs advertised for one
 * document, and the second one is an SEO problem rather than an aesthetic
 * one.
 *
 * What is emitted per page:
 *   - a title written for a result page, not for a sidebar
 *   - a canonical URL, one per document
 *   - Open Graph and Twitter cards pointing at a generated image
 *   - TechArticle, so an answer engine knows what kind of page this is
 *   - BreadcrumbList, which is what search results render as a path
 */

const DOCS_ROOT = `${baseUrl}/docs`;

/** Absolute URL for a docs path. Used by canonicals and every JSON-LD @id. */
export function docsUrl(path = ""): string {
  return path ? `${DOCS_ROOT}/${path}` : DOCS_ROOT;
}

/**
 * One date for the whole tree rather than a per-file mtime.
 *
 * A git checkout stamps every file with the time it was cloned, so a
 * per-file modification date would be the build date wearing a disguise and
 * would change on every deploy whether or not the page did. One honest date,
 * updated when the documentation is substantially revised, tells a crawler
 * more than twenty-four synthetic ones.
 */
export const DOCS_REVISED = "2026-08-29";

export function docsPageMetadata(entry: DocsEntry): Metadata {
  const url = docsUrl(entry.path);
  const title = entry.page.seoTitle;

  return {
    // `absolute` bypasses the layout's "%s — open-isms docs" template: the
    // seoTitle is already written to stand on its own, and appending a suffix
    // would push most of these past what a result page shows.
    title: { absolute: title },
    description: entry.page.description,
    keywords: [...entry.page.keywords],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description: entry.page.description,
      url,
      siteName: "open-isms docs",
      locale: "en_US",
      images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: entry.page.description,
    },
  };
}

interface JsonLdNode {
  readonly [key: string]: unknown;
}

/**
 * TechArticle rather than Article: these pages are installation and reference
 * material with commands in them, and the type is what tells an answer engine
 * whether to quote a paragraph or a procedure.
 */
export function docsArticleJsonLd(entry: DocsEntry): JsonLdNode {
  const url = docsUrl(entry.path);

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: url,
    headline: entry.page.seoTitle,
    alternativeHeadline: `${entry.page.title} — open-isms documentation`,
    description: entry.page.description,
    abstract: entry.page.description,
    articleSection: entry.section.title,
    keywords: entry.page.keywords.join(", "),
    inLanguage: "en",
    datePublished: DOCS_REVISED,
    dateModified: DOCS_REVISED,
    isPartOf: { "@id": `${DOCS_ROOT}#docs` },
    about: {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#open-isms`,
      name: "open-isms",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Docker (linux/amd64, linux/arm64)",
      license: "https://spdx.org/licenses/AGPL-3.0-or-later.html",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    publisher: { "@id": `${baseUrl}/#organization` },
    proficiencyLevel: entry.section.slug === "contributing" ? "Expert" : "Intermediate",
  };
}

export function docsBreadcrumbJsonLd(entry: DocsEntry): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${docsUrl(entry.path)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Documentation", item: DOCS_ROOT },
      { "@type": "ListItem", position: 2, name: entry.section.title },
      { "@type": "ListItem", position: 3, name: entry.page.title, item: docsUrl(entry.path) },
    ],
  };
}

/**
 * The hub, as a collection whose members are the pages. Gives a crawler the
 * whole tree from one document, and gives an answer engine a reason to treat
 * these pages as one body of work rather than twenty-four unrelated URLs.
 */
export function docsCollectionJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${DOCS_ROOT}#docs`,
    url: DOCS_ROOT,
    name: "open-isms documentation",
    description:
      "Install, configure, operate and contribute to open-isms: the open-source ISMS for the EU NIS 2 Directive.",
    inLanguage: "en",
    dateModified: DOCS_REVISED,
    isPartOf: { "@id": `${baseUrl}/#website` },
    publisher: { "@id": `${baseUrl}/#organization` },
    hasPart: DOCS_ENTRIES.map((entry) => ({
      "@type": "TechArticle",
      "@id": `${docsUrl(entry.path)}#article`,
      url: docsUrl(entry.path),
      headline: entry.page.seoTitle,
      description: entry.page.description,
    })),
  };
}
