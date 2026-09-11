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

const SAAS_FIELDS = [
  "saasHostingRegion",
  "saasEncryptionAtRest",
  "saasEncryptionInTransit",
  "saasMfaEnforced",
  "saasRtoHours",
] as const;

const ON_PREM_FIELDS = [
  "onPremSbomProvided",
  "onPremSignedReleases",
  "onPremVulnerabilityDisclosurePolicy",
  "onPremPatchSlaCriticalHours",
] as const;

const PRO_SERVICES_FIELDS = [
  "proServicesBackgroundCheckScope",
  "proServicesNdaInPlace",
  "proServicesCustomerPremisesPolicy",
] as const;

const MANAGED_SERVICES_FIELDS = [
  "managedPrivilegedAccessMgmt",
  "managedSessionRecording",
  "managedOnCall24x7",
] as const;

/**
 * Each service-type block with the toggle that turns it on.
 *
 * The mapping used to live only in the comments below ("rendered when
 * isSaas"). Anything that measures how much of the questionnaire a supplier
 * answered needs it as data — a supplier who ships no on-prem software should
 * not be scored against four on-prem questions — and a second, hand-kept copy
 * would drift the first time a field moved between blocks.
 */
export const SERVICE_TYPE_BLOCKS = [
  { gate: "isSaas", fields: SAAS_FIELDS },
  { gate: "isOnPrem", fields: ON_PREM_FIELDS },
  { gate: "isProfessionalServices", fields: PRO_SERVICES_FIELDS },
  { gate: "isManagedService", fields: MANAGED_SERVICES_FIELDS },
] as const;

/**
 * Fields on the practices page that only apply once another answer switches
 * them on. Same reason as the service-type gates: the form shows them to
 * everyone, but demanding a subprocessor list from a supplier who has no
 * subprocessors would be measuring the wrong thing.
 */
export const GATED_PRACTICE_FIELDS = {
  subprocessorList: "hasSubprocessors",
  aiSbomUrl: "providesSbomForAi",
} as const;

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
  ...SAAS_FIELDS,
  ...ON_PREM_FIELDS,
  ...PRO_SERVICES_FIELDS,
  ...MANAGED_SERVICES_FIELDS,
] as const;
