/**
 * What the GDPR walk's own screens record: the facts of a processing activity and the facts of a
 * supplier, with the answers each takes. Lists, not the database enums, so client code does not
 * load the enums' runtime; gdpr-records.test.ts pins each list to its enum.
 */

import type {
  legalBasisEnum,
  subprocessorAuthorisationEnum,
  supplierRelationshipTypeEnum,
  transferMechanismEnum,
} from "@nisd2/grc-data-model/enums";

/**
 * The slices the processing-activity catalogue is offered in (lib/processing-activities), so no
 * screen is a wall of checkboxes: staff, customers and suppliers, online, and running the company.
 */
export const ACTIVITY_GROUPS = ["staff", "customers", "online", "operations"] as const;
export type ActivityGroup = (typeof ACTIVITY_GROUPS)[number];

/**
 * What Art. 30(1) GDPR records of each processing activity, as the `processing_activity` columns
 * hold it: a describe screen asks some of them for every activity on the record. The transfer
 * fact carries its details (`transferDetails`) where the answer is yes.
 */
export const ACTIVITY_FACTS = [
  "purpose",
  "legalBases",
  "dataSubjects",
  "dataCategories",
  "specialCategories",
  "recipients",
  "transfersOutsideEea",
  "retention",
] as const;
export type ActivityFact = (typeof ACTIVITY_FACTS)[number];

/** The six lawful bases of Art. 6(1), as `processing_activity.legal_bases` stores them. */
export const LEGAL_BASES = [
  "consent",
  "contract",
  "legal_obligation",
  "vital_interests",
  "public_task",
  "legitimate_interests",
] as const satisfies readonly (typeof legalBasisEnum.enumValues)[number][];
export type LegalBasis = (typeof LEGAL_BASES)[number];

/** The facts answered yes or no; `legalBases` is a choice of several; every other fact is text. */
export const YES_NO_FACTS = [
  "specialCategories",
  "transfersOutsideEea",
] as const satisfies readonly ActivityFact[];

/**
 * What the GDPR walk records about each supplier: its role for personal data, whether the
 * processing contract is in place, whether data leaves the EEA, and how sub-processors are
 * authorised (Art. 26, 28, 44 to 46 GDPR).
 */
export const PROCESSOR_FACTS = ["role", "contract", "transfer", "subprocessing"] as const;
export type ProcessorFact = (typeof PROCESSOR_FACTS)[number];

type Relationship = (typeof supplierRelationshipTypeEnum.enumValues)[number];

/**
 * A supplier's role for the company's personal data, as the role screen offers it: one of the
 * relationships `supplier.relationship_type` stores, or none, which is `processes_personal_data`
 * false. A company's own group companies (`internal`) are not offered: the walk asks about the
 * supplier list.
 */
export const PROCESSOR_ROLES = [
  "processor",
  "separate_controller",
  "joint_controller",
  "none",
] as const satisfies readonly (Relationship | "none")[];
export type ProcessorRole = (typeof PROCESSOR_ROLES)[number];

/** The bases of a transfer outside the EEA, as `supplier.transfer_mechanism` stores them. */
export const TRANSFER_MECHANISMS = [
  "adequacy",
  "sccs",
  "bcr",
  "derogation",
  "none",
] as const satisfies readonly (typeof transferMechanismEnum.enumValues)[number][];
export type TransferMechanism = (typeof TRANSFER_MECHANISMS)[number];

/** How sub-processors are authorised, as `supplier.subprocessor_authorisation` stores it. */
export const SUBPROCESSOR_AUTHORISATIONS = [
  "general",
  "specific",
  "not_stated",
] as const satisfies readonly (typeof subprocessorAuthorisationEnum.enumValues)[number][];
export type SubprocessorAuthorisation = (typeof SUBPROCESSOR_AUTHORISATIONS)[number];

/** One supplier's answer on a processors screen, by the fact the screen asks. */
export type ProcessorAnswer =
  | { readonly fact: "role"; readonly role: ProcessorRole }
  | { readonly fact: "contract"; readonly concluded: boolean }
  | {
      readonly fact: "transfer";
      readonly outside: boolean;
      readonly mechanism: TransferMechanism | null;
    }
  | { readonly fact: "subprocessing"; readonly authorisation: SubprocessorAuthorisation };

/** A supplier row's stored GDPR answers, as the supplier list returns them. */
export interface StoredProcessor {
  readonly processesPersonalData: boolean | null;
  readonly relationshipType: Relationship | null;
  readonly processorCheckedAt: Date | string | null;
  readonly dpaConcluded: boolean | null;
  readonly internationalTransfer: boolean | null;
  readonly transferMechanism: TransferMechanism | null;
  readonly subprocessorAuthorisation: SubprocessorAuthorisation | null;
}

/** The stored role, or null while the role screen has not recorded the row. */
export const roleOf = (row: StoredProcessor): ProcessorRole | null => {
  if (row.relationshipType && row.relationshipType !== "internal")
    return row.relationshipType;
  return row.processorCheckedAt !== null && row.processesPersonalData === false
    ? "none"
    : null;
};

/**
 * What a processors screen of `fact` shows as answered for a stored row, or null. The transfer
 * columns default to "no transfer", so that screen starts every row answered, as the sign-in
 * screen of 11.1 does, and records every row it shows when the person moves on.
 */
export const storedAnswer = (
  fact: ProcessorFact,
  row: StoredProcessor,
): ProcessorAnswer | null => {
  switch (fact) {
    case "role": {
      const role = roleOf(row);
      return role ? { fact, role } : null;
    }
    case "contract":
      return row.dpaConcluded === null ? null : { fact, concluded: row.dpaConcluded };
    case "transfer":
      return {
        fact,
        outside: row.internationalTransfer === true,
        mechanism: row.transferMechanism,
      };
    case "subprocessing":
      return row.subprocessorAuthorisation === null
        ? null
        : { fact, authorisation: row.subprocessorAuthorisation };
    default:
      return fact satisfies never;
  }
};

/** Whether a supplier processes data on the company's behalf: what the later screens ask about. */
export const isProcessor = (row: StoredProcessor): boolean =>
  row.relationshipType === "processor";
