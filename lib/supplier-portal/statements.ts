import type { InferSelectModel } from "drizzle-orm";
import {
  type ProcessorAnswer,
  type ProcessorFact,
  type StoredProcessor,
  storedAnswer,
} from "@/lib/durchgang";
import type { company } from "@/schema";

/**
 * What a supplier stated about customers' personal data in its own questionnaire, read from the
 * answering company's row (`QUESTIONNAIRE_PAGES`). Null throughout for a supplier that never
 * answered.
 */
export type SupplierStatement = Pick<
  InferSelectModel<typeof company>,
  | "dataProcessingAgreement"
  | "dataProcessingLocations"
  | "personalDataTransfers"
  | "subprocessorEngagement"
  | "subprocessorList"
  | "breachNoticeToController"
>;

/**
 * The European Economic Area: the 27 member states (Greece also as the EU's own code EL) and
 * Iceland, Liechtenstein and Norway. Chapter V GDPR governs transfers outside it.
 */
const EEA = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "EL",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
]);
/** What a supplier writes for "only in the EU" instead of listing the countries. */
const WHOLE_AREA = new Set(["EU", "EEA", "EWR", "EHP"]);

const isLetters = (token: string) => [...token].every((c) => c >= "A" && c <= "Z");

/**
 * The countries a supplier named outside the EEA, from its free-text list ("DE, NL, US"), or null
 * when the text names no country code at all.
 */
export const countriesOutsideEea = (
  locations: string | null,
): readonly string[] | null => {
  const tokens = (locations ?? "")
    .split(/[\s,;/]+/)
    .map((token) => token.trim().toUpperCase())
    .filter((token) => isLetters(token) && token.length > 0);
  const codes = tokens.filter((token) => token.length === 2 && !WHOLE_AREA.has(token));
  if (codes.length === 0)
    return tokens.some((token) => WHOLE_AREA.has(token)) ? [] : null;
  return [...new Set(codes.filter((code) => !EEA.has(code)))];
};

/** The answer the supplier's statement gives for one fact, or null where it says nothing. */
export const statedAnswer = (
  fact: ProcessorFact,
  statement: SupplierStatement | null,
): ProcessorAnswer | null => {
  if (!statement) return null;
  switch (fact) {
    case "role":
      switch (statement.dataProcessingAgreement) {
        case "available":
        case "no":
          return { fact, role: "processor" };
        case "independentController":
          return { fact, role: "separate_controller" };
        case "noPersonalData":
          return { fact, role: "none" };
        default:
          return null;
      }
    case "contract":
      // Offering a DPA is not having concluded one.
      return null;
    case "transfer":
      switch (statement.personalDataTransfers) {
        case "inEea":
          return { fact, outside: false, mechanism: null };
        case "adequacy":
        case "sccs":
        case "bcr":
          return { fact, outside: true, mechanism: statement.personalDataTransfers };
        case "other":
          return { fact, outside: true, mechanism: null };
        default: {
          const outside = countriesOutsideEea(statement.dataProcessingLocations);
          return outside === null
            ? null
            : { fact, outside: outside.length > 0, mechanism: null };
        }
      }
    case "subprocessing":
      return statement.subprocessorEngagement === "general" ||
        statement.subprocessorEngagement === "specific"
        ? { fact, authorisation: statement.subprocessorEngagement }
        : null;
    default:
      return fact satisfies never;
  }
};

/** Where a row's answer comes from, which decides whether leaving the screen saves it. */
export type AnswerSource = "chosen" | "recorded" | "stated" | "default";

/**
 * The answer a processors screen shows for one supplier: chosen on this visit, else recorded by
 * the company, else stated by the supplier, else the transfer columns' default ("no transfer").
 * The company's own record outranks the supplier's statement; the statement fills a gap.
 */
export const answerFor = (
  fact: ProcessorFact,
  row: StoredProcessor & { readonly stated: SupplierStatement | null },
  chosen: ProcessorAnswer | undefined,
): { readonly answer: ProcessorAnswer; readonly source: AnswerSource } | null => {
  if (chosen?.fact === fact) return { answer: chosen, source: "chosen" };
  const stored = storedAnswer(fact, row);
  // The transfer columns default to "no transfer", so only a recorded transfer is a record.
  const recorded =
    fact === "transfer" && stored?.fact === "transfer" && !stored.outside ? null : stored;
  if (recorded) return { answer: recorded, source: "recorded" };
  const stated = statedAnswer(fact, row.stated);
  if (stated) return { answer: stated, source: "stated" };
  return stored ? { answer: stored, source: "default" } : null;
};
