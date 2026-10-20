import { describe, expect, test } from "bun:test";
import {
  frameworkEnum,
  subprocessorAuthorisationEnum,
  supplierRelationshipTypeEnum,
  transferMechanismEnum,
} from "@nisd2/grc-data-model/enums";
import { processingActivity } from "@nisd2/grc-data-model/schema";
import { getTableColumns } from "drizzle-orm";
import {
  ACTIVITY_FACTS,
  isProcessor,
  PROCESSOR_ROLES,
  roleOf,
  type StoredProcessor,
  SUBPROCESSOR_AUTHORISATIONS,
  storedAnswer,
  TRANSFER_MECHANISMS,
} from "./gdpr-records";
import { WALK_FRAMEWORKS } from "./types";

const stored = (row: Partial<StoredProcessor>): StoredProcessor => ({
  processesPersonalData: false,
  relationshipType: null,
  processorCheckedAt: null,
  dpaConcluded: null,
  internationalTransfer: false,
  transferMechanism: null,
  subprocessorAuthorisation: null,
  ...row,
});

describe("the GDPR walk's lists mirror the database", () => {
  test("every walk is a framework the database knows", () => {
    for (const framework of WALK_FRAMEWORKS) {
      expect(frameworkEnum.enumValues as readonly string[]).toContain(framework);
    }
  });

  test("the roles are the supplier relationships, less a group company, plus no personal data", () => {
    expect(PROCESSOR_ROLES.filter((r) => r !== "none").sort()).toEqual(
      supplierRelationshipTypeEnum.enumValues.filter((r) => r !== "internal").sort(),
    );
  });

  test("the transfer bases and the authorisations are exactly their enums", () => {
    expect([...TRANSFER_MECHANISMS].sort()).toEqual(
      [...transferMechanismEnum.enumValues].sort(),
    );
    expect([...SUBPROCESSOR_AUTHORISATIONS].sort()).toEqual(
      [...subprocessorAuthorisationEnum.enumValues].sort(),
    );
  });

  test("every activity fact is a column of the record", () => {
    const columns = Object.keys(getTableColumns(processingActivity));
    for (const fact of ACTIVITY_FACTS) expect(columns).toContain(fact);
  });
});

describe("what a stored supplier row answers", () => {
  test("a row never looked at has no role, even with the column defaults", () => {
    expect(roleOf(stored({}))).toBeNull();
    expect(storedAnswer("role", stored({}))).toBeNull();
  });

  test("a row recorded as receiving no personal data reads as none", () => {
    expect(roleOf(stored({ processorCheckedAt: new Date() }))).toBe("none");
  });

  test("a processor is a processor, whoever recorded it", () => {
    const row = stored({ relationshipType: "processor", processesPersonalData: true });
    expect(roleOf(row)).toBe("processor");
    expect(isProcessor(row)).toBe(true);
  });

  test("the contract and sub-processor answers are open until given", () => {
    expect(storedAnswer("contract", stored({}))).toBeNull();
    expect(storedAnswer("contract", stored({ dpaConcluded: false }))).toEqual({
      fact: "contract",
      concluded: false,
    });
    expect(storedAnswer("subprocessing", stored({}))).toBeNull();
  });

  test("the transfer screen starts every row answered from its columns", () => {
    expect(storedAnswer("transfer", stored({}))).toEqual({
      fact: "transfer",
      outside: false,
      mechanism: null,
    });
  });
});
