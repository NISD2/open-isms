import { describe, expect, test } from "bun:test";
import {
  type RecordController,
  type RecordWords,
  recordFacts,
  recordLines,
  throughLine,
} from "./record-lines";

/** A translator that shows what it was asked: the key, and the values it was given. */
const say = (key: string, values?: Record<string, string | number>): string =>
  values ? `${key}${JSON.stringify(values)}` : key;
const words: RecordWords = { say, day: (date) => `day(${String(date)})` };

const controller = (patch: Partial<RecordController> = {}): RecordController => ({
  name: "Muster GmbH",
  address: "Musterweg 1, Köln",
  email: null,
  phone: null,
  dpo: { kind: "open" },
  measures: null,
  ...patch,
});

describe("what the record states beside its activities", () => {
  test("joins the controller's details and leaves out what is missing", () => {
    expect(recordFacts(words, controller()).controllerLine).toBe(
      "Muster GmbH, Musterweg 1, Köln",
    );
  });

  test("says which of the officer's three states the company is in", () => {
    const dpoLine = (dpo: RecordController["dpo"]) =>
      recordFacts(words, controller({ dpo })).dpoLine;
    expect(dpoLine({ kind: "open" })).toBe("record.dpoOpen");
    expect(dpoLine({ kind: "none" })).toBe("record.dpoNone");
    expect(dpoLine({ kind: "designated", name: null, contact: null })).toBe(
      "record.dpoUnnamed",
    );
    expect(
      dpoLine({
        kind: "designated",
        name: "Muster Datenschutz GmbH",
        contact: "dpo@x.example",
      }),
    ).toBe("Muster Datenschutz GmbH, dpo@x.example");
  });

  test("says whether management approved the description of the measures", () => {
    const measuresLine = (measures: RecordController["measures"]) =>
      recordFacts(words, controller({ measures })).measuresLine;
    expect(measuresLine(null)).toBe("record.measuresNone");
    expect(measuresLine({ title: "TOMs", approvedAt: null })).toBe(
      'record.measuresDraft{"title":"TOMs"}',
    );
    expect(measuresLine({ title: "TOMs", approvedAt: "2026-10-20" })).toBe(
      'record.measuresApproved{"title":"TOMs","date":"day(2026-10-20)"}',
    );
  });
});

describe("the record as lines", () => {
  const lines = recordLines(
    words,
    controller(),
    [
      {
        id: "a1",
        name: "Payroll",
        purpose: "Pay wages",
        legalBases: ["contract", "legal_obligation"],
        specialCategories: false,
        transfersOutsideEea: true,
        retention: "  ",
      },
    ],
    (id) => (id === "a1" ? ["Datev", "Cloud AG"] : []),
  );

  test("opens with the controller, the officer, the measures and the day", () => {
    expect(lines.slice(0, 6).map((l) => l[0])).toEqual([
      "record.title",
      "record.controller",
      "record.dpo",
      "record.measures",
      "record.asOf",
      undefined,
    ]);
  });

  test("has a header with the suppliers last, and one line per activity", () => {
    const header = lines[6];
    expect(header?.at(0)).toBe("fields.name");
    expect(header?.at(-1)).toBe("fields.suppliers");
    expect(lines).toHaveLength(8);
    expect(lines[7]?.length).toBe(header?.length);
  });

  test("words the bases and the yes-or-no facts, blanks the empty text, lists the suppliers", () => {
    const header = lines[6] ?? [];
    const row = lines[7] ?? [];
    const at = (column: string) => row[header.indexOf(`fields.${column}`)];
    expect(at("name")).toBe("Payroll");
    expect(at("legalBases")).toBe("bases.contract; bases.legal_obligation");
    expect(at("specialCategories")).toBe("record.no");
    expect(at("transfersOutsideEea")).toBe("record.yes");
    expect(at("retention")).toBeNull();
    expect(row.at(-1)).toBe("Datev; Cloud AG");
  });
});

describe("a transfer through one supplier", () => {
  const basis = (key: string) => `basis.${key}`;

  test("names the countries and the basis", () => {
    expect(
      throughLine(say, basis, "Cloud AG", {
        kind: "outside",
        countries: "US",
        mechanism: "scc",
      }),
    ).toBe('through.outside{"name":"Cloud AG","countries":"US","basis":"basis.scc"}');
  });

  test("says so when the countries or the basis are not stated", () => {
    expect(
      throughLine(say, basis, "Cloud AG", {
        kind: "outside",
        countries: "",
        mechanism: "none",
      }),
    ).toBe(
      'through.outside{"name":"Cloud AG","countries":"through.noCountries","basis":"through.noBasis"}',
    );
  });

  test("words a supplier inside the EEA and one not answered yet", () => {
    expect(throughLine(say, basis, "Datev", { kind: "inside" })).toBe(
      'through.inside{"name":"Datev"}',
    );
    expect(throughLine(say, basis, "Datev", { kind: "open" })).toBe(
      'through.open{"name":"Datev"}',
    );
  });
});
