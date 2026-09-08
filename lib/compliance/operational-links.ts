/**
 * Module reference → route mapping.
 *
 * Links operational module table names (stored in requirement.moduleRef)
 * to their corresponding UI routes.
 */

/**
 * Map module table name → route path.
 * Used by ModuleRefPanel to link to the correct operational page.
 *
 * Every moduleRef a framework assigns needs an entry. `team` had none, and
 * because ModuleRefPanel returns null on an unmapped ref, requirement 1.2
 * (roles and responsibilities) rendered an "Operational data" heading above
 * nothing at all. `e2e/l0/module-wiring.test.ts` now fails on a gap here.
 */
export const MODULE_HREF: Record<string, string> = {
  asset: "/assets",
  team: "/team",
  risk: "/risks",
  incident: "/incidents",
  supplier: "/suppliers",
  policy: "/policies",
  training_record: "/training",
  exercise: "/exercises",
  management_review: "/management-reviews",
  kpi_measurement: "/kpis",
  change_request: "/changes",
  patch_record: "/patches",
  internal_audit: "/internal-audits",
  improvement_item: "/improvements",
  bsi_registration: "/compliance/registration",
  bsi_incident_report: "/bsi-reports",
  vulnerability: "/vulnerabilities",
};
