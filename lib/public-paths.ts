/**
 * Public route allowlist — default-deny inversion (audit followup,
 * 2026-06-11). Every route in the app falls into one of three buckets:
 *
 *   1. BYPASS — early return at the top of proxy(). Route handlers do
 *      their own auth (API routes, the trpc dispatcher), or no auth is
 *      meaningful (static metadata, internal screenshot route).
 *
 *   2. PUBLIC — the canonical (DE-keyed) path appears below in
 *      CANONICAL_PUBLIC_EXACT or CANONICAL_PUBLIC_PREFIXES. The
 *      expansion walks routing.pathnames at module init and adds every
 *      localized variant, so `/privacy` (EN/NL) gets the same
 *      classification as `/datenschutz` (DE). The next-intl pathname
 *      map is the single source of truth — the two structures cannot
 *      drift apart, and adding a new public page in routing.ts
 *      automatically opens it across all three locales.
 *
 *   3. PROTECTED — everything else. Default behavior. Proxy requires a
 *      validly-signed JWT; missing or expired tokens redirect to
 *      /auth/signin with callbackUrl preserved.
 *
 * The previous shape was an explicit *protected* allowlist. That had
 * the failure mode "forgot to add a new protected route to the list".
 * Inverting to a public allowlist makes the failure mode "forgot to add
 * a new public route to the list" — same shape but now functional
 * (users see a redirect on a public page) instead of structural (a
 * protected page silently leaks data without ever asking for auth).
 *
 * Pages that the inversion newly proxy-enforces (each ALREADY had a
 * page-level `getSession()` + redirect, so behavior is unchanged — the
 * inversion is defense in depth):
 *   - /applicability-admin
 *   - /journey
 *   - /supplier-invite/[token]
 *   - /portal/supplier-onboarding (the old `/portal/supplier` prefix
 *     match missed this because `supplier-onboarding` has no slash
 *     after `supplier`)
 *
 * /invite/[token] is also newly enforced. The invite page itself
 * renders a public "invalid/expired" card for missing tokens, so the
 * inversion changes UX slightly (signin redirect with callbackUrl
 * instead of the invalid-card page for unauthenticated visitors with a
 * good token), but the underlying acceptance flow stays gated.
 *
 * A new public page is also a choice for the self-hosted image: lib/edition/edition.test.ts fails
 * until it is either nisd2.eu's alone (lib/edition/nisd2-only.json) or kept on installs.
 */
export const CANONICAL_PUBLIC_EXACT: readonly string[] = [
  "/",
  // The promo link's sign-in page (lib/billing/promo.ts)
  "/anmelden",
  // Marketing / info pages — every page under app/[locale]/(info)/
  "/about",
  "/avv",
  "/changelog",
  "/corrections",
  "/datenschutz",
  "/ethik",
  "/features",
  "/finanzierung",
  "/hilfe",
  "/impressum",
  "/mission",
  "/nis2-lieferanten-fragebogen",
  "/nis2-meldepflicht-schema",
  "/nis2-tool",
  "/open-source",
  "/partner",
  "/pricing",
  "/pricing/approval",
  "/redaktion",
  "/sicherheit",
  "/status",
  "/subprozessoren",
  "/terms",
  "/toms",
  "/vermittlung",
  "/vertrauen",
  "/vormerken/dsgvo",
  // Public course overview and landing pages. /training itself is the portal's records page.
  "/kurse",
  "/training/cra-sbom",
  "/training/nis2-ceo",
  "/training/nis2-tabletop",
  // Standalone public pages
  "/applicability",
  "/risikobewertung",
  "/strukturanalyse",
  "/start",
  "/pitch",
  "/supplier-portal",
  // Design playgrounds for the entity + supplier portals (preview only).
  // /journey-preview/fork is deliberately NOT here: it renders both journey
  // layouts, which is the signed-in product, so it sits behind the same gate
  // as the page it previews.
  "/journey-preview",
  "/supplier-preview",
];

export const CANONICAL_PUBLIC_PREFIXES: readonly string[] = [
  // Wiki — /wiki itself + every nested category and article. The /wiki
  // segment is locale-stable; only the category and article slugs
  // change between locales, so the prefix match alone covers all three.
  "/wiki",
  // sicherheitsfragebogen.de wedge — single landing page + future
  // programmatic SEO subtrees. Same slug across all three locales so a
  // prefix entry suffices.
  "/sicherheitsfragebogen",
  // Public newsletter archive — /newsletter hub + every /newsletter/<slug>
  // permalink. Slug is locale-stable, so the prefix match covers all three.
  "/newsletter",
  // Auth flow pages — /auth/signin, /auth/forgot-password, /auth/signout
  "/auth",
  // Author bios — /autor/[slug] (DE), /author/[slug] (EN), /auteur/[slug] (NL)
  "/autor",
  // Shared gap assessment — token IS the authentication mechanism
  "/gap-assessment/share",
  // Supplier-relationship access — token-gated landing for external suppliers
  "/supplier-access",
  // Partner agreement — the token in the link is how a partner reads and accepts it
  "/partner-agreement",
];
