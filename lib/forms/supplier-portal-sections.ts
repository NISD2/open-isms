/**
 * Field-list constants for the supplier portal section pages.
 *
 * Three layers:
 *
 *   /portal/supplier/profile           — identity, marketing, incident contact
 *                                         (PROFILE_PAGE_FIELDS)
 *   /portal/supplier/practices         — universal company-wide ISMS / NIS2
 *                                         baseline practices
 *                                         (SECURITY_PRACTICES_PAGE_FIELDS)
 *   /portal/supplier/customers/[id]/access — per-customer contract clauses
 *                                            (live on the relationship row,
 *                                            not on the company)
 *
 * Profile + practices both render the same `SecurityProfileForm` against
 * `securityProfileUpdateSchema`, with the OPPOSITE field list passed as
 * `omit`, so the schema and the save endpoint stay singular.
 *
 * The customer view at /supplier-access/{token} renders profile + practices
 * WITHOUT any omit list — they see everything in one scroll because they
 * have no nav.
 */

export const PROFILE_PAGE_FIELDS = [
  // Identity (CIR §5.2 / ENISA TIG §5.2)
  "legalName",
  "registeredAddress",
  "country",
  "primaryDomain",
  "tagline",
  "description",
  "securityContactName",
  "bsiRegistrationId",
  // Customer-facing incident contact (default — per-customer SLA lives on
  // the relationship row)
  "incidentContactEmail",
  "incidentContactPhone",
] as const;

export const SECURITY_PRACTICES_PAGE_FIELDS = [
  // CIR §5.1.4 universal facts about how the company runs
  "hasIsms",
  "hasIso27001OrEquivalent",
  "staffSecurityTraining",
  "backgroundChecks",
  "vulnerabilityHandling",
  // NIS2 Art 21(2) / CIR §5.1 universal baseline practices
  "securityPolicyReviewedAnnually",
  "hasIncidentResponsePlan",
  "hasBusinessContinuityPlan",
  "hasCryptographyPolicy",
  "hasPrivilegedAccessMgmt",
  "mfaEnforcedInternal",
  "hasAssetInventory",
  "hasPenetrationTestingProgram",
  // ENISA TIG §5 — universal company-wide declarations
  "cooperateWithAuthorities",
  "pastBreachesDisclosed",
] as const;
