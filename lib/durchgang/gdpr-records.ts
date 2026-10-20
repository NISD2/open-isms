/**
 * What the GDPR walk's own screens record: the facts of a processing activity and the facts of a
 * supplier, with the answers each takes, read from the database enums.
 */

import {
  legalBasisEnum,
  subprocessorAuthorisationEnum,
  type supplierRelationshipTypeEnum,
  transferMechanismEnum,
} from "@nisd2/grc-data-model/enums";
import { z } from "zod";
import type { Supplier } from "@/schema/types";

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

/** The six lawful bases of Art. 6(1), in its order, as `processing_activity.legal_bases` stores them. */
export const LEGAL_BASES = legalBasisEnum.enumValues;
export type LegalBasis = (typeof LEGAL_BASES)[number];

/** The lawful bases a stored value holds, in the order of Art. 6(1); none for anything else. */
export const legalBasesIn = (value: unknown): readonly LegalBasis[] =>
  Array.isArray(value) ? LEGAL_BASES.filter((b) => value.includes(b)) : [];

/** The facts answered yes or no; `legalBases` is a choice of several; every other fact is text. */
export const YES_NO_FACTS = [
  "specialCategories",
  "transfersOutsideEea",
] as const satisfies readonly ActivityFact[];
export type YesNoFact = (typeof YES_NO_FACTS)[number];
export const isYesNoFact = (fact: string): fact is YesNoFact =>
  (YES_NO_FACTS as readonly string[]).includes(fact);

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
export const TRANSFER_MECHANISMS = transferMechanismEnum.enumValues;
export type TransferMechanism = (typeof TRANSFER_MECHANISMS)[number];

/** How sub-processors are authorised, as `supplier.subprocessor_authorisation` stores it. */
export const SUBPROCESSOR_AUTHORISATIONS = subprocessorAuthorisationEnum.enumValues;
export type SubprocessorAuthorisation = (typeof SUBPROCESSOR_AUTHORISATIONS)[number];

/**
 * One supplier's answer on a processors screen, by the fact the screen asks: the one shape the
 * screen, its draft and `durchgang.gdpr.recordProcessors` all take.
 */
export const processorAnswerSchema = z.discriminatedUnion("fact", [
  z.object({ fact: z.literal("role"), role: z.enum(PROCESSOR_ROLES) }),
  z.object({ fact: z.literal("contract"), concluded: z.boolean() }),
  z.object({
    fact: z.literal("transfer"),
    outside: z.boolean(),
    mechanism: z.enum(TRANSFER_MECHANISMS).nullable(),
  }),
  z.object({
    fact: z.literal("subprocessing"),
    authorisation: z.enum(SUBPROCESSOR_AUTHORISATIONS),
  }),
]);
export type ProcessorAnswer = Readonly<z.infer<typeof processorAnswerSchema>>;
export type ProcessorFact = ProcessorAnswer["fact"];

/** A supplier row's stored GDPR answers, as the supplier list returns them. */
export type StoredProcessor = Readonly<
  Pick<
    Supplier,
    | "processesPersonalData"
    | "relationshipType"
    | "dpaConcluded"
    | "internationalTransfer"
    | "transferMechanism"
    | "subprocessorAuthorisation"
  > & {
    // Dates arrive as strings where a server component passed the row through JSON.
    readonly processorCheckedAt: Date | string | null;
    readonly transferCheckedAt: Date | string | null;
  }
>;

/** The stored role, or null while the role screen has not recorded the row. */
export const roleOf = (row: StoredProcessor): ProcessorRole | null => {
  if (row.relationshipType && row.relationshipType !== "internal")
    return row.relationshipType;
  return row.processorCheckedAt !== null && row.processesPersonalData === false
    ? "none"
    : null;
};

/**
 * What the company has recorded for a stored row on a processors screen of `fact`, or null. The
 * transfer column defaults to "no transfer", so a "no" counts only once the walk recorded it.
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
      return row.internationalTransfer === true || row.transferCheckedAt !== null
        ? {
            fact,
            outside: row.internationalTransfer === true,
            mechanism: row.transferMechanism,
          }
        : null;
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
