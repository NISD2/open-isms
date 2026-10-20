/**
 * A supplier's own questionnaire answers fill the GDPR walk's processor screens where the company
 * has recorded nothing. Pinned here: which answer means which role, how a country list becomes
 * "inside" or "outside" the EEA, that offering a DPA never reads as having concluded one, and that
 * the company's own record always outranks the supplier's statement.
 */
import { describe, expect, test } from "bun:test";
import type { StoredProcessor } from "@/lib/durchgang";
import {
  answerFor,
  countriesOutsideEea,
  type SupplierStatement,
  statedAnswer,
} from "./statements";

const said = (statement: Partial<SupplierStatement>): SupplierStatement => ({
  dataProcessingAgreement: null,
  dataProcessingLocations: null,
  personalDataTransfers: null,
  subprocessorEngagement: null,
  subprocessorList: null,
  breachNoticeToController: null,
  ...statement,
});

const row = (
  stored: Partial<StoredProcessor>,
  stated: SupplierStatement | null,
): StoredProcessor & { stated: SupplierStatement | null } => ({
  processesPersonalData: false,
  relationshipType: null,
  processorCheckedAt: null,
  dpaConcluded: null,
  internationalTransfer: false,
  transferMechanism: null,
  subprocessorAuthorisation: null,
  ...stored,
  stated,
});

describe("countries outside the EEA", () => {
  test("names the codes outside, in any case and separator", () => {
    expect(countriesOutsideEea("DE, nl; US / ch")).toEqual(["US", "CH"]);
  });

  test("counts Iceland, Liechtenstein, Norway and Greece as EL as inside", () => {
    expect(countriesOutsideEea("IS, LI, NO, EL, GR")).toEqual([]);
  });

  test("reads 'EU only' as inside, and a list without codes as nothing said", () => {
    expect(countriesOutsideEea("EU")).toEqual([]);
    expect(countriesOutsideEea("Germany and the United States")).toBeNull();
    expect(countriesOutsideEea(null)).toBeNull();
  });
});

describe("what a supplier's answers say", () => {
  test("a DPA offered or missing makes a processor; a controller or no data says so", () => {
    expect(statedAnswer("role", said({ dataProcessingAgreement: "available" }))).toEqual({
      fact: "role",
      role: "processor",
    });
    expect(statedAnswer("role", said({ dataProcessingAgreement: "no" }))).toEqual({
      fact: "role",
      role: "processor",
    });
    expect(
      statedAnswer("role", said({ dataProcessingAgreement: "independentController" })),
    ).toEqual({ fact: "role", role: "separate_controller" });
    expect(
      statedAnswer("role", said({ dataProcessingAgreement: "noPersonalData" })),
    ).toEqual({ fact: "role", role: "none" });
  });

  test("offering a DPA never reads as a concluded contract", () => {
    expect(
      statedAnswer("contract", said({ dataProcessingAgreement: "available" })),
    ).toBeNull();
  });

  test("a stated transfer basis carries over; 'another basis' leaves the basis to the company", () => {
    expect(statedAnswer("transfer", said({ personalDataTransfers: "sccs" }))).toEqual({
      fact: "transfer",
      outside: true,
      mechanism: "sccs",
    });
    expect(statedAnswer("transfer", said({ personalDataTransfers: "other" }))).toEqual({
      fact: "transfer",
      outside: true,
      mechanism: null,
    });
    expect(statedAnswer("transfer", said({ personalDataTransfers: "inEea" }))).toEqual({
      fact: "transfer",
      outside: false,
      mechanism: null,
    });
  });

  test("without that answer, the country list decides inside or outside", () => {
    expect(statedAnswer("transfer", said({ dataProcessingLocations: "DE, US" }))).toEqual(
      {
        fact: "transfer",
        outside: true,
        mechanism: null,
      },
    );
    expect(statedAnswer("transfer", said({ dataProcessingLocations: "DE, FR" }))).toEqual(
      {
        fact: "transfer",
        outside: false,
        mechanism: null,
      },
    );
  });

  test("no sub-processors is no authorisation to record", () => {
    expect(
      statedAnswer("subprocessing", said({ subprocessorEngagement: "none" })),
    ).toBeNull();
    expect(
      statedAnswer("subprocessing", said({ subprocessorEngagement: "general" })),
    ).toEqual({
      fact: "subprocessing",
      authorisation: "general",
    });
  });

  test("a supplier that never answered says nothing", () => {
    expect(statedAnswer("role", null)).toBeNull();
  });
});

describe("which answer a row shows", () => {
  const processor = said({ dataProcessingAgreement: "available" });

  test("the company's record outranks the supplier's statement", () => {
    const recorded = row(
      { relationshipType: "separate_controller", processorCheckedAt: new Date() },
      processor,
    );
    expect(answerFor("role", recorded, undefined)).toEqual({
      answer: { fact: "role", role: "separate_controller" },
      source: "recorded",
    });
  });

  test("the statement fills a gap, and a choice on this visit outranks both", () => {
    const open = row({}, processor);
    expect(answerFor("role", open, undefined)?.source).toBe("stated");
    expect(answerFor("role", open, { fact: "role", role: "none" })).toEqual({
      answer: { fact: "role", role: "none" },
      source: "chosen",
    });
  });

  test("the default 'no transfer' gives way to a supplier that names a country outside", () => {
    const abroad = row({}, said({ dataProcessingLocations: "US" }));
    expect(answerFor("transfer", abroad, undefined)?.source).toBe("stated");
    const recordedAbroad = row(
      { internationalTransfer: true, transferMechanism: "adequacy" },
      said({ personalDataTransfers: "sccs" }),
    );
    expect(answerFor("transfer", recordedAbroad, undefined)).toEqual({
      answer: { fact: "transfer", outside: true, mechanism: "adequacy" },
      source: "recorded",
    });
    expect(answerFor("transfer", row({}, null), undefined)?.source).toBe("default");
  });
});
