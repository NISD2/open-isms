import type { QuestionnaireAnswers } from "@/lib/supplier-portal/completeness";

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
export const SAMPLE_PROFILE: QuestionnaireAnswers = {
  legalName: "Musterland IT-Services GmbH",
  registeredAddress: "Musterstraße 12, 40213 Musterstadt",
  country: "DE",
  primaryDomain: "musterland-it.de",
  serviceDescription:
    "Betrieb und Wartung der Warenwirtschaft für mittelständische Entsorger, als gehostete Anwendung mit Fernwartung.",
  dataProcessingLocations: "Deutschland",
  securityContactName: "A. Weber",
  incidentContactEmail: "security@musterland-it.de",
  incidentContactPhone: "+49 211 000000 (Mo bis Fr, 8 bis 18 Uhr)",
  isSaas: true,
  isOnPrem: false,
  isProfessionalServices: false,
  isManagedService: true,
  processesCustomerData: true,
  accessesCustomerSystems: true,
  incidentSlaHours: 24,
  vulnerabilityHandling: true,
  acceptRightToAudit: true,
  hasSubprocessors: true,
  subprocessorList:
    "Musterland Hosting GmbH (Rechenzentrum, DE) · Musterland Backup GmbH (Sicherung, DE)",
  subprocessorRequirementsPassedOn: true,
  notifyMaterialChanges: true,
  dataReturnOnTermination: true,
  dpaAvailable: true,
  pastBreachesDisclosed: false,
  cooperateWithAuthorities: true,
  hasIso27001OrEquivalent: false,
  hasIsms: true,
  staffSecurityTraining: true,
  backgroundChecks: true,
  hasIncidentResponsePlan: true,
  hasBusinessContinuityPlan: true,
  mfaEnforcedInternal: true,
  hasPenetrationTestingProgram: false,
  secureDevelopment: true,
  saasEncryptionAtRest: true,
  saasEncryptionInTransit: true,
  saasMfaEnforced: true,
  saasRtoHours: 8,
  managedPrivilegedAccessMgmt: false,
  managedAdminAccessLogged: true,
};
