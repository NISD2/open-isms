import { defineRouting } from "next-intl/routing";
import { wikiPathnames } from "@/lib/content/wiki-toc";

/**
 * Routing config — locales + localized pathnames.
 *
 * Convention: the canonical path (the key in `pathnames`) is the
 * German-slug URL. EN and NL get proper localized slugs.
 *
 * /docs pathnames (hub + 8 categories + 33 pages) are derived from
 * lib/content/docs-toc.ts via wikiPathnames() so the migration list
 * and the URL map cannot drift apart. Legacy non-docs URLs that have
 * been migrated under /docs are no longer registered here — they are
 * served via 301 redirects defined in lib/content/legacy-redirects.ts.
 *
 * Token routes (/invite/[token], /supplier-access/[token],
 * /supplier-invite/[token]) are intentionally NOT registered —
 * auto-generated, single-use, never indexed.
 */
const locales = ["de", "en", "nl", "fr", "it", "es", "pl", "cs", "pt", "ro"] as const;
type Loc = (typeof locales)[number];

/**
 * Localized pathnames are authored for de/en/nl. New locales (fr/it/es/pl)
 * inherit the English slug until per-locale URL slugs are written, so the
 * slug map stays in one place instead of editing ~57 route entries.
 */
function fill<T extends Record<string, string | Partial<Record<Loc, string>>>>(
  obj: T,
): { [K in keyof T]: T[K] extends string ? string : Record<Loc, string> } {
  const out: Record<string, string | Record<Loc, string>> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      out[key] = value;
      continue;
    }
    const fallback = value.en ?? value.de ?? Object.values(value)[0] ?? key;
    const record = {} as Record<Loc, string>;
    for (const loc of locales) record[loc] = value[loc] ?? fallback;
    out[key] = record;
  }
  // The imperative build above produces exactly this shape; TS can't follow it.
  return out as { [K in keyof T]: T[K] extends string ? string : Record<Loc, string> };
}

export const routing = defineRouting({
  locales,
  defaultLocale: "de",
  localePrefix: "as-needed",
  localeCookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
  pathnames: fill({
    "/": "/",

    // ── /docs hub, 8 categories, 33 pages — derived from docs-toc ─────
    ...wikiPathnames(),

    // Public newsletter archive hub + dynamic issue permalinks. Slugs come
    // from the DB; the [slug] param route is registered (universal slug, brand
    // term) so typed <Link>s resolve and the proxy /newsletter prefix admits it.
    "/newsletter": "/newsletter",
    "/newsletter/[slug]": "/newsletter/[slug]",

    // Wiki citation library — primary-source Legislation references
    "/wiki/zitate": {
      de: "/wiki/zitate",
      en: "/wiki/citations",
      nl: "/wiki/citaten",
    },

    // News-media trust pages — referenced from Organization JSON-LD
    "/redaktion": {
      de: "/redaktion",
      en: "/editorial-principles",
      nl: "/redactie",
    },
    "/ethik": {
      de: "/ethik",
      en: "/ethics",
      nl: "/ethiek",
    },
    "/finanzierung": {
      de: "/finanzierung",
      en: "/how-we-are-funded",
      nl: "/financiering",
    },

    // Author profile pages — E-E-A-T signal targets for Person JSON-LD
    "/autor/simon-orzel": {
      de: "/autor/simon-orzel",
      en: "/author/simon-orzel",
      nl: "/auteur/simon-orzel",
    },
    "/autor/cory-hisey": {
      de: "/autor/cory-hisey",
      en: "/author/cory-hisey",
      nl: "/auteur/cory-hisey",
    },

    // ── sicherheitsfragebogen.de wedge — second brand surface for the
    // supplier portal product. Single landing page funnels into the
    // existing /supplier-portal sign-up flow. When host-routing for
    // sicherheitsfragebogen.de goes live, the middleware rewrites the
    // root path there into this subtree.
    "/sicherheitsfragebogen": "/sicherheitsfragebogen",

    // ── Other public pages (legal, operational, functional) ──────────
    "/nis2-lieferanten-fragebogen": {
      de: "/nis2-lieferanten-fragebogen",
      en: "/nis2-supplier-questionnaire",
      nl: "/nis2-leveranciersvragenlijst",
    },
    "/nis2-meldepflicht-schema": {
      de: "/nis2-meldepflicht-schema",
      en: "/nis2-incident-notification-schema",
      nl: "/nis2-incidentmelding-schema",
    },
    "/applicability": {
      de: "/applicability",
      en: "/applicability",
      nl: "/toepasselijkheid",
    },
    "/risikobewertung": {
      de: "/risikobewertung",
      en: "/risk-assessment",
      nl: "/risicobeoordeling",
    },
    "/strukturanalyse": {
      de: "/strukturanalyse",
      en: "/asset-inventory",
      nl: "/asset-inventarisatie",
    },
    "/features": {
      de: "/features",
      en: "/features",
      nl: "/functies",
    },
    "/pricing": {
      de: "/pricing",
      en: "/pricing",
      nl: "/prijzen",
    },
    "/about": {
      de: "/about",
      en: "/about",
      nl: "/over-ons",
    },
    "/corrections": {
      de: "/corrections",
      en: "/corrections",
      nl: "/correcties",
    },
    "/terms": {
      de: "/terms",
      en: "/terms",
      nl: "/voorwaarden",
    },
    "/datenschutz": {
      de: "/datenschutz",
      en: "/privacy",
      nl: "/privacy",
    },
    "/impressum": {
      de: "/impressum",
      en: "/imprint",
      nl: "/colofon",
    },
    "/avv": {
      de: "/avv",
      en: "/dpa",
      nl: "/verwerkersovereenkomst",
    },
    "/sicherheit": {
      de: "/sicherheit",
      en: "/security",
      nl: "/beveiliging",
    },
    "/vertrauen": {
      de: "/vertrauen",
      en: "/trust",
      nl: "/vertrouwen",
    },
    "/subprozessoren": {
      de: "/subprozessoren",
      en: "/subprocessors",
      nl: "/subverwerkers",
    },

    // Pitch deck (universal term, same slug across locales)
    "/pitch": "/pitch",

    // Universal slugs (proper nouns, acronyms, brand terms)
    "/mission": "/mission",
    "/open-source": "/open-source",
    "/partner": "/partner",
    "/changelog": "/changelog",
    "/status": "/status",
    "/nis2-tool": "/nis2-tool",
    "/toms": "/toms",

    // Training (course landing under (info)) — keep DE unchanged
    "/training/nis2-ceo": "/training/nis2-ceo",
    "/training/nis2-tabletop": "/training/nis2-tabletop",
    "/training/cra-sbom": "/training/cra-sbom",

    // ── Tier 2: Public pre-login pages ────────────────────────────────────
    "/onboarding": "/onboarding",
    "/start": "/start",
    "/auth/signin": "/auth/signin",
    "/auth/forgot-password": "/auth/forgot-password",
    "/auth/signout": "/auth/signout",
    "/supplier-portal": {
      de: "/supplier-portal",
      en: "/supplier-portal",
      nl: "/leveranciersportaal",
    },

    // ── Tier 3: Portal pages (logged in; unlocalized) ────────────────────
    "/dashboard": "/dashboard",
    "/dashboard/stats": "/dashboard/stats",
    "/applicability-admin": "/applicability-admin",
    "/assets": "/assets",
    "/audit": "/audit",
    "/audit-readiness": "/audit-readiness",
    "/changes": "/changes",
    "/compliance": "/compliance",
    "/compliance/[categorySlug]": "/compliance/[categorySlug]",
    "/compliance/[categorySlug]/[requirementCode]":
      "/compliance/[categorySlug]/[requirementCode]",
    "/exercises": "/exercises",
    "/export": "/export",
    "/gap-assessment": "/gap-assessment",
    "/gap-assessment/[day]": "/gap-assessment/[day]",
    "/gap-assessment/results": "/gap-assessment/results",
    "/improvements": "/improvements",
    "/incidents": "/incidents",
    "/internal-audits": "/internal-audits",
    "/journey": "/journey",
    "/kpis": "/kpis",
    "/management-reviews": "/management-reviews",
    "/notifications": "/notifications",
    "/organization": "/organization",
    "/patches": "/patches",
    "/policies": "/policies",
    "/review": "/review",
    "/risks": "/risks",
    "/settings": "/settings",
    "/suppliers": "/suppliers",
    "/team": "/team",
    "/training": "/training",
    "/vulnerabilities": "/vulnerabilities",

    // Supplier portal (logged in)
    "/portal/supplier": "/portal/supplier",
    "/portal/supplier/certifications": "/portal/supplier/certifications",
    "/portal/supplier/customers": "/portal/supplier/customers",
    "/portal/supplier/customers/[relationshipId]/access":
      "/portal/supplier/customers/[relationshipId]/access",
    "/portal/supplier/customers/[relationshipId]/assets":
      "/portal/supplier/customers/[relationshipId]/assets",
    "/portal/supplier/customers/[relationshipId]/incidents":
      "/portal/supplier/customers/[relationshipId]/incidents",
    "/portal/supplier/practices": "/portal/supplier/practices",
    "/portal/supplier/profile": "/portal/supplier/profile",
    "/portal/supplier-onboarding": "/portal/supplier-onboarding",

    // Training (logged in)
    "/training/courses": "/training/courses",
    "/training/courses/[courseId]": "/training/courses/[courseId]",
    "/training/courses/[courseId]/[lessonId]":
      "/training/courses/[courseId]/[lessonId]",

    // Admin
    "/platform-admin": "/platform-admin",
  }),
});
