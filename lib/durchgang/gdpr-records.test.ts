import { describe, expect, test } from "bun:test";
import { frameworkEnum, supplierRelationshipTypeEnum } from "@nisd2/grc-data-model/enums";
import { processingActivity } from "@nisd2/grc-data-model/schema";
import { getTableColumns } from "drizzle-orm";
import {
  ACTIVITY_FACTS,
  isProcessor,
  PROCESSOR_ROLES,
  roleOf,
  type StoredProcessor,
  storedAnswer,
  throughSupplier,
  transferComplete,
} from "./gdpr-records";
import { WALK_FRAMEWORKS } from "./types";

const stored = (row: Partial<StoredProcessor>): StoredProcessor => ({
  processesPersonalData: false,
  relationshipType: null,
  processorCheckedAt: null,
  dpaConcluded: null,
  internationalTransfer: false,
  transferMechanism: null,
  transferCountries: null,
  transferCheckedAt: null,
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

  test("the column's default 'no transfer' is open until the walk records it", () => {
    expect(storedAnswer("transfer", stored({}))).toBeNull();
    expect(storedAnswer("transfer", stored({ transferCheckedAt: new Date() }))).toEqual({
      fact: "transfer",
      outside: false,
      mechanism: null,
      countries: null,
    });
    expect(
      storedAnswer(
        "transfer",
        stored({ internationalTransfer: true, transferMechanism: "sccs" }),
      ),
    ).toEqual({ fact: "transfer", outside: true, mechanism: "sccs", countries: null });
  });
});

describe("an activity's transfers through a linked supplier", () => {
  test("read from the supplier's row: open, inside, or outside with where and on what", () => {
    expect(throughSupplier(stored({}))).toEqual({ kind: "open" });
    expect(throughSupplier(stored({ transferCheckedAt: new Date() }))).toEqual({
      kind: "inside",
    });
    expect(
      throughSupplier(
        stored({
          internationalTransfer: true,
          transferMechanism: "adequacy",
          transferCountries: "USA",
          transferCheckedAt: new Date(),
        }),
      ),
    ).toEqual({ kind: "outside", countries: "USA", mechanism: "adequacy" });
  });

  test("a transfer outside the EEA is complete only with its basis and countries", () => {
    const outside = { fact: "transfer", outside: true } as const;
    expect(transferComplete({ ...outside, mechanism: "sccs", countries: "USA" })).toBe(
      true,
    );
    expect(transferComplete({ ...outside, mechanism: "sccs", countries: " " })).toBe(
      false,
    );
    expect(transferComplete({ ...outside, mechanism: null, countries: "USA" })).toBe(
      false,
    );
    expect(
      transferComplete({
        fact: "transfer",
        outside: false,
        mechanism: null,
        countries: null,
      }),
    ).toBe(true);
  });
});
