import { describe, expect, test } from "bun:test";
import type { ReportCategory } from "@/lib/pdf/load-report-data";
import { REPORT_FIXTURE } from "@/scripts/lib/pdf-fixtures";
import { REQUIREMENT_CSV_HEADERS, requirementsCsvTable } from "./requirements-csv";

const GOV = REPORT_FIXTURE.categories[0];
if (!GOV) throw new Error("The report fixture has no first category");
const signedAndReviewed = GOV.requirements[0];
if (!signedAndReviewed) throw new Error("The report fixture's first category is empty");

/** The case #504 fixed: filled in through the walk while its stored row still says not started. */
const filledInTheWalk: ReportCategory = {
  ...GOV,
  requirements: [
    {
      ...signedAndReviewed,
      code: "GOV-03",
      state: "awaiting",
      approved: false,
      coveredBy: { kind: "walk", codes: ["2.1"] },
      notes: "30.10.2026: adopted BSI 200-3",
      signedOffAt: null,
      evidence: [],
    },
  ],
};

const column = (name: (typeof REQUIREMENT_CSV_HEADERS)[number]) =>
  REQUIREMENT_CSV_HEADERS.indexOf(name);

describe("requirementsCsvTable", () => {
  test("the columns #504 set: the translated status, then the walk's notes, no stored status", () => {
    const [header] = requirementsCsvTable([], "en");
    expect(header?.slice(5, 7)).toEqual(["Status", "Walkthrough Notes"]);
    expect(header).not.toContain("Stored Status");
  });

  test("prints the walk's status in the reader's language, never the stored value", () => {
    const [, en] = requirementsCsvTable([filledInTheWalk], "en");
    const [, de] = requirementsCsvTable([filledInTheWalk], "de");
    expect(en?.[column("Status")]).toBe("In the walkthrough with 2.1, awaiting sign-off");
    expect(de?.[column("Status")]).toBe("Im Durchgang mit 2.1, wartet auf Freigabe");
    expect(en).not.toContain("not_started");
    expect(en?.[column("Walkthrough Notes")]).toBe("30.10.2026: adopted BSI 200-3");
  });

  test("one row per requirement, every row as wide as the header", () => {
    const table = requirementsCsvTable(REPORT_FIXTURE.categories, "de");
    const count = REPORT_FIXTURE.categories.flatMap((c) => c.requirements).length;
    expect(table).toHaveLength(count + 1);
    for (const row of table) expect(row).toHaveLength(REQUIREMENT_CSV_HEADERS.length);
    expect(table[1]?.[column("Status")]).toBe("Geprüft");
  });
});
