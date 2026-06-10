import { companyInsertSchema } from "@/schema/validators";
import { type ZodRawShape, type ZodObject } from "zod";

// Bridge drizzle-zod BuildSchema (Zod v3 internals) → Zod v4 ZodObject
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle-zod uses "strip" literal vs Zod v4's $strip symbol
export const companyFormSchema = companyInsertSchema as unknown as ZodObject<ZodRawShape, any>;

export const SECTORS = [
  "energy",
  "transport",
  "banking",
  "financial_market",
  "health",
  "drinking_water",
  "waste_water",
  "digital_infrastructure",
  "ict_service_management",
  "public_administration",
  "space",
  "postal_courier",
  "waste_management",
  "chemicals",
  "food",
  "manufacturing",
  "digital_providers",
  "research",
] as const;

/**
 * Fields hidden from the entity-side organization form. The role flags +
 * supplier-portal columns live on `company` (same row, two perspectives) but
 * the entity portal has no business rendering "Hosting region" or "DPA
 * available" — those belong to the supplier portal's own forms.
 *
 * Anything new that lives on `company` and is supplier-portal-only must be
 * added here, otherwise SchemaForm will auto-render it from drizzle-zod.
 */
export const COMPANY_FORM_OMIT = [
  "id",
  "createdAt",
  "updatedAt",
  "subSector",
  "annualRevenue",
  "globalTurnover",
  "contactPhone",
  "aiDataSharing",
  "timezone",
  "digestTime",
  "plan",
  "stripeCustomerId",
  "stripeSubscriptionId",
  // Role flags — set by their respective portals, never edited via the org form
  "actsAsNis2Entity",
  "actsAsSupplier",
  // Supplier portal: public identity + customer-facing contact
  "legalName",
  "registeredAddress",
  "country",
  "primaryDomain",
  "tagline",
  "description",
  "logoStorageKey",
  "securityContactName",
  "incidentContactEmail",
  "incidentContactPhone",
  "incidentSlaHours",
  // Supplier portal: service type
  "isSaas",
  "isOnPrem",
  "isProfessionalServices",
  "isManagedService",
  // Supplier portal: CIR §5.1.4 universal contract clauses
  "hasIsms",
  "hasIso27001OrEquivalent",
  "staffSecurityTraining",
  "backgroundChecks",
  "vulnerabilityHandling",
  "acceptRightToAudit",
  "hasSubprocessors",
  "subprocessorList",
  "dataReturnOnTermination",
  "dpaAvailable",
  // Supplier portal: NIS2 Art 21(2) / CIR §5.1 universal baseline practices
  "securityPolicyReviewedAnnually",
  "hasIncidentResponsePlan",
  "hasBusinessContinuityPlan",
  "hasCryptographyPolicy",
  "hasPrivilegedAccessMgmt",
  "mfaEnforcedInternal",
  "hasAssetInventory",
  "hasPenetrationTestingProgram",
  // Supplier portal: ENISA TIG §5 supplier-specific declarations
  "serviceDescription",
  "dataProcessingLocations",
  "notifyOnLocationChange",
  "incidentAssistanceCommitment",
  "cooperateWithAuthorities",
  "notifyMaterialChanges",
  "hasExitPlan",
  "pastBreachesDisclosed",
  // Supplier portal: SaaS branch
  "saasHostingRegion",
  "saasEncryptionAtRest",
  "saasEncryptionInTransit",
  "saasMfaEnforced",
  "saasRtoHours",
  // Supplier portal: on-prem branch
  "onPremSbomProvided",
  "onPremSignedReleases",
  "onPremVulnerabilityDisclosurePolicy",
  "onPremPatchSlaCriticalHours",
  // Supplier portal: professional services branch
  "proServicesBackgroundCheckScope",
  "proServicesNdaInPlace",
  "proServicesCustomerPremisesPolicy",
  // Supplier portal: managed service branch
  "managedPrivilegedAccessMgmt",
  "managedSessionRecording",
  "managedOnCall24x7",
  "questionnaireLastSavedAt",
] as const;

/** Extra fields to omit during onboarding (too much for step 1) */
export const PROFILE_FIELDS = [
  "cisoName",
  "cisoReportsTo",
  "bsiContactName",
  "bsiContactEmail",
  "bsiContactPhone",
  "bsiRegistrationId",
  "annualSecurityBudget",
  "primaryLocations",
] as const;

/** Onboarding omits base fields + profile fields (filled in later via /organization) */
export const ONBOARDING_OMIT = [...COMPANY_FORM_OMIT, ...PROFILE_FIELDS] as const;

export interface CompanyFormData {
  name: string;
  sector: string;
  entityType: "essential" | "important" | "kritis";
  legalForm?: string;
  employeeCount?: number;
  contactEmail?: string;
  cisoName?: string;
  cisoReportsTo?: string;
  bsiContactName?: string;
  bsiContactEmail?: string;
  bsiContactPhone?: string;
  bsiRegistrationId?: string;
  annualSecurityBudget?: string;
  primaryLocations?: string;
}

export function parseCompanyFormData(data: Record<string, unknown>): CompanyFormData {
  return {
    name: data.name as string,
    sector: data.sector as string,
    entityType: data.entityType as "essential" | "important" | "kritis",
    legalForm: (data.legalForm as string) || undefined,
    employeeCount: (data.employeeCount as number) ?? undefined,
    contactEmail: (data.contactEmail as string) || undefined,
    cisoName: (data.cisoName as string) || undefined,
    cisoReportsTo: (data.cisoReportsTo as string) || undefined,
    bsiContactName: (data.bsiContactName as string) || undefined,
    bsiContactEmail: (data.bsiContactEmail as string) || undefined,
    bsiContactPhone: (data.bsiContactPhone as string) || undefined,
    bsiRegistrationId: (data.bsiRegistrationId as string) || undefined,
    annualSecurityBudget: (data.annualSecurityBudget as string) || undefined,
    primaryLocations: (data.primaryLocations as string) || undefined,
  };
}
