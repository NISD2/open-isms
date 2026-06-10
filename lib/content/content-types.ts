/**
 * Content-type taxonomy for the docs hub.
 *
 * Each docs page declares its content type, which determines:
 *   - The schema.org JSON-LD subtype emitted.
 *   - The default body length budget for the generation prompt.
 *   - The default CTA shape.
 *   - Default content path: `/wiki/<category>/<slug>`.
 *
 * Defined here: 2026-05-29 alongside docs-architecture-2026-05-29.md.
 */

export const DOCS_CATEGORIES = [
  "scope",          // A — "Bin ich X?"
  "glossar",        // B — definitions from CEO course dictionary
  "felder",         // C — asset / supplier modifier fields
  "anleitungen",    // D.1 + D.3 — how-tos
  "probleme",       // D.2 — problem / panic queries
  "iso-27001",      // E — ISO 27001 bridge (NIS 2 anchored)
  "cra",            // F — CRA + NIS 2 sister regulation
  "vergleich",      // adjacent — NIS 2 vs DSGVO / DORA / KRITIS / etc.
] as const;

export type DocsCategory = (typeof DOCS_CATEGORIES)[number];

export const DOCS_CONTENT_TYPES = [
  "Article",             // generic explainer / opinion / scope explanation
  "DefinedTerm",         // single dictionary term
  "HowTo",               // step-by-step implementation
  "FAQPage",             // FAQ-shaped problem-solving
  "SoftwareApplication", // generator / downloadable artefact
] as const;

export type DocsContentType = (typeof DOCS_CONTENT_TYPES)[number];

/**
 * Default content type per category. Page authors can override per-page
 * in the registry, but staying with the default is the simpler path.
 */
export const CATEGORY_DEFAULT_TYPE: Record<DocsCategory, DocsContentType> = {
  scope: "Article",
  glossar: "DefinedTerm",
  felder: "Article",
  anleitungen: "HowTo",
  probleme: "Article",
  "iso-27001": "Article",
  cra: "Article",
  vergleich: "Article",
};

/**
 * Default word budget per content type, used by the generation prompt to
 * keep articles concise.
 */
export const CONTENT_TYPE_WORD_BUDGET: Record<DocsContentType, { min: number; max: number }> = {
  Article: { min: 800, max: 1500 },
  DefinedTerm: { min: 150, max: 400 },
  HowTo: { min: 400, max: 800 },
  FAQPage: { min: 600, max: 1200 },
  SoftwareApplication: { min: 400, max: 800 },
};

/**
 * Human-readable category labels for breadcrumbs and the docs sidebar.
 */
export const CATEGORY_LABEL_DE: Record<DocsCategory, string> = {
  scope: "Anwendungsbereich",
  glossar: "Glossar",
  felder: "Felder erklärt",
  anleitungen: "Anleitungen",
  probleme: "Was tun, wenn",
  "iso-27001": "ISO 27001 Brücke",
  cra: "CRA",
  vergleich: "Vergleich",
};

export const CATEGORY_LABEL_EN: Record<DocsCategory, string> = {
  scope: "Scope",
  glossar: "Glossary",
  felder: "Fields explained",
  anleitungen: "How-to",
  probleme: "Troubleshooting",
  "iso-27001": "ISO 27001 bridge",
  cra: "CRA",
  vergleich: "Comparison",
};

export const CATEGORY_LABEL_NL: Record<DocsCategory, string> = {
  scope: "Toepassingsgebied",
  glossar: "Woordenlijst",
  felder: "Velden uitgelegd",
  anleitungen: "Handleidingen",
  probleme: "Probleemoplossing",
  "iso-27001": "ISO 27001 brug",
  cra: "CRA",
  vergleich: "Vergelijking",
};

export function categoryLabel(category: DocsCategory, locale: "de" | "en" | "nl"): string {
  if (locale === "en") return CATEGORY_LABEL_EN[category];
  if (locale === "nl") return CATEGORY_LABEL_NL[category];
  return CATEGORY_LABEL_DE[category];
}
