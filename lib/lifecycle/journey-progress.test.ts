import { describe, expect, test } from "bun:test";
import { type JourneyStatusRow, summarizeJourneys } from "./journey-progress";

/**
 * Fixtures use REAL requirement codes, because the order is now a property of the code and not
 * of the row. An earlier version carried sortOrder, categorySortOrder and priority on every row
 * and tested a ranking formula; that formula ignored prerequisites and let the email name "accept
 * the residual risks" as the next step while the register it depends on was still open.
 *
 * The journey order these rely on: 12.1, 12.2, 1.1, 2.1, 2.2, 5.1, 12.3, 1.2, 3.1, 3.3, 1.3,
 * 1.4, 2.3, 2.4, ... (see journey-position.test.ts for the properties that pin it).
 */
function row(companyId: string, status: string | null, code: string): JourneyStatusRow {
  return { companyId, status, code };
}

describe("summarizeJourneys", () => {
  test("a prerequisite beats urgency: the register comes before accepting residual risks", () => {
    // 2.4 is P0 and 2.3 is P1. Urgency alone named 2.4; the seed says 2.3 must come first.
    const summaries = summarizeJourneys([
      row("c1", "not_started", "2.4"),
      row("c1", "not_started", "2.3"),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("2.3");
  });

  test("where nothing constrains it, urgency leads over process order", () => {
    // 12.1 (registration, P0) is in the last-numbered category; 1.2 (roles, P1) in the first.
    const summaries = summarizeJourneys([
      row("c1", "not_started", "1.2"),
      row("c1", "not_started", "12.1"),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("12.1");
  });

  test("empty input yields an empty map", () => {
    expect(summarizeJourneys([]).size).toBe(0);
  });

  test("counts done vs total and picks the first open step in journey order", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "12.1"),
      row("c1", "in_progress", "12.2"),
      row("c1", "not_started", "1.1"),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 3, done: 1, nextCode: "12.2" });
  });

  test("completed, approved and not_applicable all count as done", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "12.1"),
      row("c1", "approved", "12.2"),
      row("c1", "not_applicable", "1.1"),
      row("c1", "needs_review", "2.1"),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 4, done: 3, nextCode: "2.1" });
  });

  test("fully done journey has no next step", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "12.1"),
      row("c1", "approved", "12.2"),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 2, done: 2, nextCode: null });
  });

  test("null status counts as open (not_started)", () => {
    const summaries = summarizeJourneys([row("c1", null, "12.1")]);
    expect(summaries.get("c1")).toEqual({ total: 1, done: 0, nextCode: "12.1" });
  });

  test("a code the journey does not know sinks behind every known one", () => {
    // Codes arrive from old emails and bookmarks; an unknown one must never be named as next
    // ahead of real work.
    const summaries = summarizeJourneys([
      row("c1", "not_started", "99.9"),
      row("c1", "not_started", "3.1"),
    ]);
    expect(summaries.get("c1")?.nextCode).toBe("3.1");
  });

  test("ties between unknown codes break deterministically by code", () => {
    const a = summarizeJourneys([
      row("c1", "not_started", "Z-REQ"),
      row("c1", "not_started", "A-REQ"),
    ]);
    const b = summarizeJourneys([
      row("c1", "not_started", "A-REQ"),
      row("c1", "not_started", "Z-REQ"),
    ]);
    expect(a.get("c1")?.nextCode).toBe("A-REQ");
    expect(b.get("c1")?.nextCode).toBe("A-REQ");
  });

  test("companies are summarized independently", () => {
    const summaries = summarizeJourneys([
      row("c1", "completed", "12.1"),
      row("c2", "not_started", "12.1"),
    ]);
    expect(summaries.get("c1")).toEqual({ total: 1, done: 1, nextCode: null });
    expect(summaries.get("c2")).toEqual({ total: 1, done: 0, nextCode: "12.1" });
  });
});
