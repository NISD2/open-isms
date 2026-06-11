/**
 * Field-list constants for the supplier portal section pages.
 *
 * Four layers:
 *
 *   /portal/supplier/profile           — identity, marketing, incident contact,
 *                                         service-type toggles
 *                                         (PROFILE_PAGE_FIELDS)
 *   /portal/supplier/practices         — universal company-wide ISMS / NIS 2
 *                                         baseline practices + contract clauses
 *                                         (SECURITY_PRACTICES_PAGE_FIELDS)
 *   /portal/supplier/service-type      — SaaS / on-prem / professional services /
 *                                         managed services technical
 *                                         declarations (SERVICE_TYPE_PAGE_FIELDS)
 *   /portal/supplier/customers/[id]/access — per-customer contract clauses
 *                                            (live on the relationship row,
 *                                            not on the company)
 *
 * Profile, practices, and service-type all render the same
 * `SecurityProfileForm` against `securityProfileUpdateSchema`, with the
 * OPPOSITE field lists passed as `omit`, so the schema and the save endpoint
 * stay singular.
 *
 * The customer view at /supplier-access/{token} renders all three sub-pages
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
  // Service description + processing locations (ENISA TIG §5.2(b), §5.1.4 TIPS)
  "serviceDescription",
  "dataProcessingLocations",
  // Customer-facing incident contact (default — per-customer SLA lives on
  // the relationship row)
  "incidentContactEmail",
  "incidentContactPhone",
  "incidentSlaHours",
  // Service-type toggles (ENISA TIG §5.2(b)) — drive the conditional
  // technical sections on the service-type page below.
  "isSaas",
  "isOnPrem",
  "isProfessionalServices",
  "isManagedService",
  "usesAiSystems",
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
  // CIR §5.1.4 / GDPR Art. 28 — universal contract clauses (extension)
  "acceptRightToAudit",
  "hasSubprocessors",
  "subprocessorList",
  "dataReturnOnTermination",
  "dpaAvailable",
  // ENISA TIG §5.1.4 TIPS — additional supplier commitments
  "incidentAssistanceCommitment",
  "notifyMaterialChanges",
  "notifyOnLocationChange",
  "hasExitPlan",
  // NIS 2 Art. 21(2)(d) — AI-system declarations
  "providesSbomForAi",
  "aiSbomUrl",
] as const;

/**
 * Service-type page — renders the four service-type-conditional sections
 * (SaaS, On-prem, Professional services, Managed services). Every field
 * appears on a single scroll; until SchemaForm supports visibleWhen, the
 * supplier just answers "no / blank" for the sections that do not apply.
 *
 * Lives on `/portal/supplier/service-type` so the Profile page stays focused
 * on identity / contact + the toggle pickers.
 */
export const SERVICE_TYPE_PAGE_FIELDS = [
  // SaaS technical (rendered when isSaas)
  "saasHostingRegion",
  "saasEncryptionAtRest",
  "saasEncryptionInTransit",
  "saasMfaEnforced",
  "saasRtoHours",
  // On-prem technical (rendered when isOnPrem)
  "onPremSbomProvided",
  "onPremSignedReleases",
  "onPremVulnerabilityDisclosurePolicy",
  "onPremPatchSlaCriticalHours",
  // Professional services (rendered when isProfessionalServices)
  "proServicesBackgroundCheckScope",
  "proServicesNdaInPlace",
  "proServicesCustomerPremisesPolicy",
  // Managed services (rendered when isManagedService)
  "managedPrivilegedAccessMgmt",
  "managedSessionRecording",
  "managedOnCall24x7",
] as const;
