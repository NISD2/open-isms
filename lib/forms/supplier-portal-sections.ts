/**
 * Where each question of the supplier questionnaire sits in the supplier portal: which page, which
 * group, in what order. The questions themselves (wording in every language, legal basis, when one
 * shows) live in the questionnaire package (`@nisd2/nis2-supply-chain-questionnaire-schema`), the
 * open format this portal implements, and `supplier-portal-sections.test.ts` fails if a question
 * there is placed nowhere, placed twice, or placed here without existing there.
 *
 *   /portal/supplier/profile       who you are, how to reach you, what you reach at customers
 *   /portal/supplier/practices     what you commit to, how you run security, how you access customers
 *   /portal/supplier/service-type  details for software as a service and delivered software
 *
 * Each placed question is answered in the `company` column of the same name, so this layout is
 * also the one list of the questionnaire's columns: the save schema
 * (`securityProfileUpdateSchema`) and every query that reads the answers derive from it. The
 * customer's view shows the same groups read-only.
 *
 * Kept free of runtime imports: the save schema is used in the browser, and this file must not
 * pull the questionnaire's text into every bundle that validates a form.
 */
import type { company } from "@/schema";

type CompanyColumn = keyof typeof company.$inferInsert;

export interface QuestionnaireGroup {
  /** Names the group's heading and its "why we ask" line in messages (supplierPortal.questionnaire.groups). */
  readonly key: string;
  readonly fields: readonly CompanyColumn[];
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
        "isManagedService",
        "processesCustomerData",
        "dataProcessingLocations",
        "accessesCustomerSystems",
        "accessesCustomerPremises",
      ],
    },
  ],
  practices: [
    {
      key: "commitments",
      fields: [
        "incidentSlaHours",
        "acceptRightToAudit",
        "hasSubprocessors",
        "subprocessorList",
        "subprocessorRequirementsPassedOn",
        "notifyMaterialChanges",
        "pastBreachesDisclosed",
        "cooperateWithAuthorities",
        "confidentialityCommitted",
        "dataReturnOnTermination",
        "dataProcessingAgreement",
      ],
    },
    {
      key: "operations",
      fields: [
        "staffSecurityTraining",
        "backgroundChecks",
        "hasIsms",
        "hasIso27001OrEquivalent",
        "hasIncidentResponsePlan",
        "hasBusinessContinuityPlan",
        "mfaEnforcedInternal",
        "vulnerabilityHandling",
        "hasPenetrationTestingProgram",
        "secureDevelopment",
        "vulnerabilityDisclosurePolicy",
        "encryptionAtRest",
        "encryptionInTransit",
      ],
    },
    {
      key: "access",
      fields: [
        "customerAccessPersonalMfa",
        "customerAccessLogged",
        "premisesAccessManaged",
        "premisesConductRules",
      ],
    },
  ],
  serviceType: [
    { key: "saas", fields: ["saasMfaEnforced", "saasRtoHours"] },
    {
      key: "onPrem",
      fields: [
        "onPremSupportEnd",
        "onPremPatchSlaCriticalHours",
        "onPremSbomProvided",
        "onPremSignedReleases",
      ],
    },
  ],
} as const satisfies Record<string, readonly QuestionnaireGroup[]>;

/**
 * Package questions this portal answers somewhere other than the questionnaire form, each with
 * where. Asking them in the form as well would record the same fact twice.
 */
export const ANSWERED_ELSEWHERE: Readonly<Record<string, string>> = {
  // Standard, issuer, validity and scope are recorded per certificate, with the file itself.
  certificationDetails: "/portal/supplier/certifications",
};

export type QuestionnairePage = keyof typeof QUESTIONNAIRE_PAGES;

/** A question the portal asks, which is also the `company` column holding its answer. */
export type QuestionnaireField =
  (typeof QUESTIONNAIRE_PAGES)[QuestionnairePage][number]["fields"][number];

const fieldsOf = (page: QuestionnairePage): readonly QuestionnaireField[] =>
  QUESTIONNAIRE_PAGES[page].flatMap(
    (group): readonly QuestionnaireField[] => group.fields,
  );

export const PROFILE_PAGE_FIELDS = fieldsOf("profile");
export const SECURITY_PRACTICES_PAGE_FIELDS = fieldsOf("practices");
export const SERVICE_TYPE_PAGE_FIELDS = fieldsOf("serviceType");

/** Every question the portal asks, across its three pages. */
export const QUESTIONNAIRE_FIELDS: readonly QuestionnaireField[] = [
  ...PROFILE_PAGE_FIELDS,
  ...SECURITY_PRACTICES_PAGE_FIELDS,
  ...SERVICE_TYPE_PAGE_FIELDS,
];

/** The questionnaire's columns as a `{ column: true }` mask, for a Zod `.pick` or a query's `columns`. */
export const QUESTIONNAIRE_COLUMNS = Object.fromEntries(
  QUESTIONNAIRE_FIELDS.map((field) => [field, true]),
) as { readonly [K in QuestionnaireField]: true };
