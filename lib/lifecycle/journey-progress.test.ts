import { describe, expect, test } from "bun:test";
import { type JourneyStatusRow, summarizeJourneys } from "./journey-progress";

/**
 * Fixtures mirror real seed data: requirement.sortOrder restarts at 0 in
 * every category (it is a WITHIN-category index), so the category order must
 * decide between them. An earlier version of these tests used globally
 * unique sortOrders that production never has, which let a raw-sortOrder
 * implementation pass while disagreeing with the journey view.
 *
 * Priority defaults to P1, the middle tier, so the cases below that say
 * nothing about urgency keep testing the process ordering on its own.
 */
function row(
  companyId: string,
  status: string | null,
  code: string,
  sortOrder: number | null,
  categorySortOrder: number | null,
  priority: string | null = "P1",
): JourneyStatusRow {
  return { companyId, status, code, sortOrder, categorySortOrder, priority };
}

describe("summarizeJourneys", () => {
  test("a P0 anywhere on the path beats an earlier P1", () => {
    // EFF-1 is in the last category; GOV-1 is in the first. Urgency leads, so
    // the defensible-minimum step is next even though the whole process sits
    // in front of it. Process order alone would say GOV-1.
    const summaries = summarizeJourneys([
      row("c1", "not_started", "GOV-1", 0, 0, "P1"),
      row("c1", "not_started", "EFF-1", 0, 11, "P0"),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("EFF-1");
  });

  test("within one tier the process order still decides", () => {
    const summaries = summarizeJourneys([
      row("c1", "not_started", "EFF-1", 0, 11, "P0"),
      row("c1", "not_started", "GOV-1", 0, 0, "P0"),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("GOV-1");
  });

  test("a deferrable P2 loses to a later P1", () => {
    const summaries = summarizeJourneys([
      row("c1", "not_started", "GOV-1", 0, 0, "P2"),
      row("c1", "not_started", "EFF-1", 0, 11, "P1"),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("EFF-1");
  });

  test("empty input yields an empty map", () => {
    expect(summarizeJourneys([]).size).toBe(0);
  });

  test("counts done vs total and picks the first open step in journey order", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "GOV-1", 0, 0),
      row("c1", "in_progress", "GOV-2", 1, 0),
      row("c1", "not_started", "RISK-1", 0, 1),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 3, done: 1, nextCode: "GOV-2" });
  });

  test("an earlier category's open step beats a later category's lower sortOrder", () => {
    // RISK-1 has sortOrder 0, GOV-3 has sortOrder 2 — but GOV comes first on
    // the path, so GOV-3 is the next step. Raw sortOrder would say RISK-1.
    const summaries = summarizeJourneys([
      row("c1", "completed", "GOV-1", 0, 0),
      row("c1", "completed", "GOV-2", 1, 0),
      row("c1", "not_started", "GOV-3", 2, 0),
      row("c1", "not_started", "RISK-1", 0, 1),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("GOV-3");
  });

  test("ties on position break deterministically by code", () => {
    const a = summarizeJourneys([
      row("c1", "not_started", "B-REQ", 0, 0),
      row("c1", "not_started", "A-REQ", 0, 0),
    ]);
    const b = summarizeJourneys([
      row("c1", "not_started", "A-REQ", 0, 0),
      row("c1", "not_started", "B-REQ", 0, 0),
    ]);
    expect(a.get("c1")?.nextCode).toBe("A-REQ");
    expect(b.get("c1")?.nextCode).toBe("A-REQ");
  });

  test("completed, approved and not_applicable all count as done", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "A", 0, 0),
      row("c1", "approved", "B", 1, 0),
      row("c1", "not_applicable", "C", 2, 0),
      row("c1", "needs_review", "D", 3, 0),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 4, done: 3, nextCode: "D" });
  });

  test("fully done journey has no next step", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "A", 0, 0),
      row("c1", "approved", "B", 1, 0),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 2, done: 2, nextCode: null });
  });

  test("null status counts as open (not_started)", () => {
    const summaries = summarizeJourneys([row("c1", null, "A", 0, 0)]);
    expect(summaries.get("c1")).toEqual({ total: 1, done: 0, nextCode: "A" });
  });

  test("missing orders sink behind known positions", () => {
    const summaries = summarizeJourneys([
      row("c1", "not_started", "UNORDERED", null, null),
      row("c1", "not_started", "FIRST", 2, 3),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("FIRST");
  });

  test("companies are summarized independently", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "A", 0, 0),
      row("c2", "not_started", "A", 0, 0),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 1, done: 1, nextCode: null });
    expect(summaries.get("c2")).toEqual({ total: 1, done: 0, nextCode: "A" });
  });
});
