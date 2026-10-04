/**
 * Where each question of the supplier questionnaire sits in the supplier portal: which page, which
 * group, in what order. A layout decision only. The questions themselves (wording in every
 * language, legal basis, when one shows) live in the questionnaire package
 * (`@nisd2/nis2-supply-chain-questionnaire-schema`), the open format this portal implements, and
 * `supplier-portal-sections.test.ts` fails if a question there is placed nowhere, placed twice, or
 * placed here without existing there.
 *
 *   /portal/supplier/profile       who you are, how to reach you, what you deliver
 *   /portal/supplier/practices     what you commit to, how you run security
 *   /portal/supplier/service-type  details for the service types ticked on the profile
 *
 * The answers are columns on the supplier's `company` row (`securityProfileUpdateSchema`), so each
 * id here is also a column. The customer's view shows the same groups read-only.
 */
import type { securityProfileUpdateSchema } from "@/schema/validators";

export type QuestionnaireField = keyof typeof securityProfileUpdateSchema.shape;

export interface QuestionnaireGroup {
  /** Names the group's heading and its "why we ask" line in messages (supplierPortal.questionnaire.groups). */
  readonly key: string;
  readonly fields: readonly QuestionnaireField[];
}

export const QUESTIONNAIRE_PAGES = {
  profile: [
    {
      key: "identity",
      fields: [
        "legalName",
        "registeredAddress",
        "country",
        "primaryDomain",
        "serviceDescription",
        "dataProcessingLocations",
      ],
    },
    {
      key: "contacts",
      fields: ["securityContactName", "incidentContactEmail", "incidentContactPhone"],
    },
    {
      key: "delivery",
      fields: [
        "isSaas",
        "isOnPrem",
        "isProfessionalServices",
        "isManagedService",
        "processesCustomerData",
        "accessesCustomerSystems",
      ],
    },
  ],
  practices: [
    {
      key: "commitments",
      fields: [
        "incidentSlaHours",
        "vulnerabilityHandling",
        "acceptRightToAudit",
        "hasSubprocessors",
        "subprocessorList",
        "subprocessorRequirementsPassedOn",
        "notifyMaterialChanges",
        "dataReturnOnTermination",
        "dpaAvailable",
        "pastBreachesDisclosed",
        "cooperateWithAuthorities",
      ],
    },
    {
      key: "operations",
      fields: [
        "hasIso27001OrEquivalent",
        "hasIsms",
        "staffSecurityTraining",
        "backgroundChecks",
        "hasIncidentResponsePlan",
        "hasBusinessContinuityPlan",
        "mfaEnforcedInternal",
        "hasPenetrationTestingProgram",
        "secureDevelopment",
      ],
    },
  ],
  serviceType: [
    {
      key: "saas",
      fields: [
        "saasEncryptionAtRest",
        "saasEncryptionInTransit",
        "saasMfaEnforced",
        "saasRtoHours",
      ],
    },
    {
      key: "onPrem",
      fields: [
        "onPremSbomProvided",
        "onPremSignedReleases",
        "onPremVulnerabilityDisclosurePolicy",
        "onPremPatchSlaCriticalHours",
      ],
    },
    {
      key: "proServices",
      fields: ["proServicesNdaInPlace", "proServicesCustomerPremisesPolicy"],
    },
    {
      key: "managed",
      fields: ["managedPrivilegedAccessMgmt", "managedAdminAccessLogged"],
    },
  ],
} as const satisfies Record<string, readonly QuestionnaireGroup[]>;

export type QuestionnairePage = keyof typeof QUESTIONNAIRE_PAGES;

const fieldsOf = (page: QuestionnairePage): readonly QuestionnaireField[] =>
  QUESTIONNAIRE_PAGES[page].flatMap(
    (group): readonly QuestionnaireField[] => group.fields,
  );

export const PROFILE_PAGE_FIELDS = fieldsOf("profile");
export const SECURITY_PRACTICES_PAGE_FIELDS = fieldsOf("practices");
export const SERVICE_TYPE_PAGE_FIELDS = fieldsOf("serviceType");
