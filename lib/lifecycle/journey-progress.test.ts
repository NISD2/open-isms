import { describe, expect, test } from "bun:test";
import { type JourneyStatusRow, summarizeJourneys } from "./journey-progress";

function row(
  companyId: string,
  status: string | null,
  code: string,
  sortOrder: number | null,
): JourneyStatusRow {
  return { companyId, status, code, sortOrder };
}

describe("summarizeJourneys", () => {
  test("empty input yields an empty map", () => {
    expect(summarizeJourneys([]).size).toBe(0);
  });

  test("counts done vs total and picks the first open step in path order", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "GOV-1", 1),
      row("c1", "in_progress", "GOV-2", 2),
      row("c1", "not_started", "RISK-1", 3),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 3, done: 1, nextCode: "GOV-2" });
  });

  test("completed, approved and not_applicable all count as done", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "A", 1),
      row("c1", "approved", "B", 2),
      row("c1", "not_applicable", "C", 3),
      row("c1", "needs_review", "D", 4),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 4, done: 3, nextCode: "D" });
  });

  test("fully done journey has no next step", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "A", 1),
      row("c1", "approved", "B", 2),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 2, done: 2, nextCode: null });
  });

  test("null status counts as open (not_started)", () => {
    const summaries = summarizeJourneys([row("c1", null, "A", 1)]);
    expect(summaries.get("c1")).toEqual({ total: 1, done: 0, nextCode: "A" });
  });

  test("missing sortOrder sinks behind ordered steps", () => {
    const summaries = summarizeJourneys([
      row("c1", "not_started", "UNORDERED", null),
      row("c1", "not_started", "FIRST", 5),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("FIRST");
  });

  test("companies are summarized independently", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "A", 1),
      row("c2", "not_started", "A", 1),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 1, done: 1, nextCode: null });
    expect(summaries.get("c2")).toEqual({ total: 1, done: 0, nextCode: "A" });
  });
});
