import type { SecurityProfileInitialValues } from "@/components/supplier-portal/SecurityProfileForm";

/**
 * Sample supplier for the hero screenshot. Deliberately a placeholder company
 * on placeholder domains ("Musterland", "musterstadt") so nothing in the
 * published image can be read as a real customer relationship.
 */
export const SAMPLE_USER = {
  name: "A. Weber",
  email: "security@musterland-it.de",
  image: null,
  isPlatformAdmin: false,
} as const;

export const SAMPLE_CUSTOMERS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    customerEmail: "ciso@stadtwerke-musterstadt.de",
    customerOrgName: "Stadtwerke Musterstadt",
    status: "active" as const,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    customerEmail: "it@muster-entsorgung.de",
    customerOrgName: "Muster Entsorgung GmbH",
    status: "active" as const,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    customerEmail: "informationssicherheit@klinikum-musterstadt.de",
    customerOrgName: "Klinikum Musterstadt",
    status: "active" as const,
  },
];

/**
 * A filled-in security profile. Not every answer is "yes" — a questionnaire
 * where everything is ticked reads as a mock-up rather than a real profile.
 */
export const SAMPLE_PROFILE: SecurityProfileInitialValues = {
  legalName: "Musterland IT-Services GmbH",
  registeredAddress: "Musterstraße 12, 40213 Musterstadt",
  country: "DE",
  primaryDomain: "musterland-it.de",
  securityContactName: "A. Weber",
  incidentContactEmail: "security@musterland-it.de",
  incidentContactPhone: "+49 211 000000",
  incidentSlaHours: 24,
  hasIsms: true,
  hasIso27001OrEquivalent: true,
  staffSecurityTraining: true,
  backgroundChecks: true,
  vulnerabilityHandling: true,
  securityPolicyReviewedAnnually: true,
  hasIncidentResponsePlan: true,
  hasBusinessContinuityPlan: true,
  hasCryptographyPolicy: true,
  hasPrivilegedAccessMgmt: true,
  mfaEnforcedInternal: true,
  hasAssetInventory: true,
  hasPenetrationTestingProgram: false,
  cooperateWithAuthorities: true,
  pastBreachesDisclosed: false,
  acceptRightToAudit: true,
  hasSubprocessors: true,
  subprocessorList: "Hetzner Online GmbH (Hosting, DE) · Musterland Backup GmbH (Backup, DE)",
  dataReturnOnTermination: true,
  dpaAvailable: true,
  incidentAssistanceCommitment: true,
  notifyMaterialChanges: true,
  notifyOnLocationChange: true,
  hasExitPlan: false,
  providesSbomForAi: false,
};
