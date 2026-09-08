/**
 * Which operational modules can be counted, and by what.
 *
 * Split out from `module-recheck.ts` so the answer to "does this moduleRef
 * have a counter?" can be read without a database or a validated environment.
 * `module-recheck.ts` reaches `lib/env.ts` transitively and throws at import
 * time outside a configured runtime, which put this knowledge out of reach of
 * the drift test that should be guarding it.
 *
 * That guard matters because a missing entry fails silently:
 * `recheckModuleRequirements` returns early on an unknown ref, so a module
 * with no counter simply never invalidates its requirements. `team` had none,
 * and requirement 1.2 (roles and responsibilities) kept its sign-off no matter
 * who joined, left or changed role.
 *
 * `e2e/l0/module-wiring.test.ts` asserts every moduleRef the framework
 * assigns appears here.
 */

/**
 * Modules stored one row per record in a table of the same name, scoped by a
 * `company_id` column. Counted by the generic query.
 */
export const COMPANY_SCOPED_MODULE_TABLES = [
  "asset",
  "risk",
  "incident",
  "supplier",
  "policy",
  "training_record",
  "exercise",
  "management_review",
  "kpi_measurement",
  "change_request",
  "patch_record",
  "vulnerability",
  "internal_audit",
  "improvement_item",
  "bsi_registration",
] as const;

/**
 * Modules that need their own query: no table of that name, or no direct
 * `company_id`. `team` members are `user` rows; a BSI incident report reaches
 * its company through the incident it belongs to.
 */
export const CUSTOM_COUNT_MODULES = ["team", "bsi_incident_report"] as const;

/** Every moduleRef `recheckModuleRequirements` knows how to count. */
export const COUNTABLE_MODULES: ReadonlySet<string> = new Set<string>([
  ...COMPANY_SCOPED_MODULE_TABLES,
  ...CUSTOM_COUNT_MODULES,
]);
