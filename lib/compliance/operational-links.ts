/**
 * Module reference → route mapping.
 *
 * Links operational module table names (stored in requirement.moduleRef)
 * to their corresponding UI routes.
 */

/**
 * Map module table name → route path.
 * Used by ModuleRefPanel to link to the correct operational page.
 */
export const MODULE_HREF: Record<string, string> = {
  asset: "/assets",
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
