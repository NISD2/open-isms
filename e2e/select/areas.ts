/**
 * Which browser specs a change needs. One table for each direction: what each spec covers, and
 * which source paths belong to which area. `select.ts` reads both; `e2e/l0/e2e-select.test.ts`
 * fails when a spec on disk has no entry here, so a new spec cannot be skipped by accident.
 *
 * Fail safe: a path no entry claims runs the whole suite. Narrow only what is clearly one area's.
 */

export const AREAS = [
  "walk",
  "billing",
  "export",
  "registers",
  "signoff",
  "supplier",
  "mcp",
  "security",
  "auth",
  "onboarding",
] as const;
export type Area = (typeof AREAS)[number];

/** Signing in, and the check that the app renders at all: every selected run starts with them. */
export const ALWAYS = ["e2e/auth.setup.ts", "e2e/smoke.spec.ts"] as const;

/**
 * The specs that fill the shared tenant with intake answers and assets. Later layers sign off
 * against those answers (a saved answer makes a requirement signable again) and list those
 * assets, so an area whose specs rely on them pulls these in first.
 */
export const TENANT_DATA = ["e2e/l1/intake.spec.ts", "e2e/l1/assets.spec.ts"] as const;

/**
 * The areas whose specs read what `TENANT_DATA` leaves in the tenant. The walk's own specs need
 * it too: run alone on a fresh database, `l2/durchgang.spec.ts` finds 11.2 without the answers
 * intake saves (measured 20.10.2026).
 */
export const NEEDS_TENANT_DATA: readonly Area[] = ["signoff", "registers", "walk"];

/**
 * What each spec covers. `full` runs only with the whole suite: the grand tour signs all 49
 * requirements and needs every layer before it.
 */
export const SPEC_AREAS: Readonly<Record<string, readonly Area[] | "full">> = {
  "e2e/signup.spec.ts": ["auth"],
  "e2e/l1/guide.spec.ts": ["onboarding"],
  "e2e/l1/journey-mobile.spec.ts": ["onboarding"],
  "e2e/l2/durchgang-agreements.spec.ts": ["walk"],
  "e2e/l2/durchgang-backups-crypto.spec.ts": ["walk"],
  "e2e/l2/durchgang-concepts.spec.ts": ["walk"],
  "e2e/l2/durchgang-continuity.spec.ts": ["walk"],
  "e2e/l2/durchgang-gdpr-people.spec.ts": ["walk"],
  "e2e/l2/durchgang-gdpr.spec.ts": ["walk"],
  "e2e/l2/durchgang-incident-plan.spec.ts": ["walk"],
  "e2e/l2/durchgang-leitlinie.spec.ts": ["walk"],
  "e2e/l2/durchgang-lists.spec.ts": ["walk"],
  "e2e/l2/durchgang-logins.spec.ts": ["walk"],
  "e2e/l2/durchgang-open-points.spec.ts": ["walk"],
  "e2e/l2/durchgang-registers.spec.ts": ["walk"],
  "e2e/l2/durchgang-review.spec.ts": ["walk", "signoff"],
  "e2e/l2/durchgang-staff-training.spec.ts": ["walk"],
  "e2e/l2/durchgang.spec.ts": ["walk"],
  "e2e/l2/walk-front.spec.ts": ["walk", "billing"],
  "e2e/l2/walk-front-gdpr.spec.ts": ["walk", "billing"],
  "e2e/l2/export.spec.ts": ["export", "billing"],
  "e2e/l2/edit-delete.spec.ts": ["registers"],
  "e2e/l2/editors.spec.ts": ["registers"],
  "e2e/l2/evidence.spec.ts": ["registers"],
  "e2e/l2/modules.spec.ts": ["registers"],
  "e2e/l2/requirement-detail.spec.ts": ["registers"],
  "e2e/l2/validation.spec.ts": ["registers"],
  "e2e/l3/cross-tenant.spec.ts": ["security"],
  "e2e/l3/durchgang-link.spec.ts": ["walk", "signoff"],
  "e2e/l3/mcp-fill.spec.ts": ["mcp", "walk"],
  "e2e/l3/mcp-read-records.spec.ts": ["mcp", "export"],
  "e2e/l3/sign-off-after-save.spec.ts": ["signoff"],
  "e2e/l3/signoff.spec.ts": ["signoff"],
  "e2e/l3/supplier-portal.spec.ts": ["supplier"],
  "e2e/l3/team-signoff-invalidation.spec.ts": ["signoff"],
  "e2e/l4/grand-tour.spec.ts": "full",
};

/**
 * Source paths and the areas they belong to, by prefix; the longest matching prefix decides. An
 * empty list means no browser spec reads the path (docs, wiki text): only `ALWAYS` runs.
 */
export const PATH_AREAS: ReadonlyArray<
  readonly [prefix: string, areas: readonly Area[]]
> = [
  // The walkthrough
  ["app/[locale]/(portal)/durchgang/", ["walk"]],
  ["components/durchgang/", ["walk"]],
  ["lib/durchgang/", ["walk", "mcp"]],
  ["server/trpc/routers/durchgang", ["walk"]],
  ["server/trpc/helpers/durchgang", ["walk"]],
  ["messages/durchgang/", ["walk"]],
  ["public/images/durchgang/", ["walk"]],
  // The GDPR walk's record of processing activities, which its specs open
  ["app/[locale]/(portal)/processing-activities/", ["walk"]],
  ["components/processing-activities/", ["walk"]],
  ["lib/processing-activities/", ["walk"]],
  ["server/trpc/routers/processing-activity", ["walk"]],
  ["messages/processingActivities/", ["walk"]],
  // MCP
  ["lib/mcp/", ["mcp"]],
  ["app/api/mcp/", ["mcp"]],
  ["app/[locale]/(portal)/mcp/", ["mcp"]],
  // Ordering, billing and the terms
  ["lib/billing/", ["billing"]],
  ["components/billing/", ["billing"]],
  ["components/pricing/", ["billing"]],
  ["app/[locale]/(portal)/billing/", ["billing"]],
  ["app/[locale]/(portal)/bestellen/", ["billing"]],
  ["server/trpc/routers/billing", ["billing"]],
  ["messages/billing/", ["billing"]],
  ["messages/pricing/", ["billing"]],
  ["messages/agb/", ["billing"]],
  // Exports
  ["lib/export/", ["export"]],
  ["components/export/", ["export"]],
  ["app/[locale]/(portal)/export/", ["export"]],
  ["app/api/export/", ["export"]],
  ["app/api/download/", ["export"]],
  // The supplier portal
  ["lib/supplier-portal/", ["supplier"]],
  ["components/supplier-portal/", ["supplier"]],
  ["app/[locale]/supplier-portal/", ["supplier"]],
  ["server/trpc/routers/supplier-portal/", ["supplier"]],
  // Onboarding surfaces
  ["components/onboarding/", ["onboarding"]],
  ["lib/onboarding/", ["onboarding"]],
  // No browser spec reads these
  ["docs/", []],
  ["content/", []],
  ["courses/", []],
  ["e2e/l0/", []],
  ["e2e/README.md", []],
  ["README.md", []],
  ["CLAUDE.md", []],
  ["CHANGELOG.md", []],
  ["app/[locale]/wiki/", []],
  ["components/wiki/", []],
  ["messages/info/", []],
  ["messages/landing/", []],
];

/**
 * Files inside an area's folder that every request goes through, so a change to one runs the whole
 * suite: the paywall's procedure list and the assistant key list gate every tRPC call
 * (server/trpc/init.ts), and the promo is read by the route gate (proxy.ts).
 */
export const RUNS_ALL: readonly string[] = [
  "lib/billing/access.ts",
  "lib/billing/promo.ts",
  "lib/mcp/procedures.ts",
];

/** The PR label that runs the whole suite whatever changed. */
export const FULL_LABEL = "e2e:full";
