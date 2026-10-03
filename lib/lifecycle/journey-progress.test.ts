import { describe, expect, test } from "bun:test";
import type { DotState } from "@/lib/compliance/journey-position";
import type { CoveredBy, JourneyEntry } from "@/lib/durchgang";
import { summarizeJourneys } from "./journey-progress";

/**
 * Fixtures use REAL requirement codes, because the order is now a property of the code and not
 * of the row. An earlier version carried sortOrder, categorySortOrder and priority on every row
 * and tested a ranking formula; that formula ignored prerequisites and let the email name "accept
 * the residual risks" as the next step while the register it depends on was still open.
 *
 * The journey order these rely on: 12.1, 12.2, 1.1, 2.1, 2.2, 5.1, 12.3, 1.2, 3.1, 3.3, 1.3,
 * 1.4, 2.3, 2.4, ... (see journey-position.test.ts for the properties that pin it).
 */
type Entry = readonly [code: string, state: DotState, coveredBy?: CoveredBy];

const journeys = (byCompany: Record<string, readonly Entry[]>) =>
  new Map(
    Object.entries(byCompany).map(([companyId, entries]) => [
      companyId,
      new Map(
        entries.map(([code, state, coveredBy = null]): [string, JourneyEntry] => [
          code,
          { state, coveredBy },
        ]),
      ),
    ]),
  );

const NOT_REQUIRED: CoveredBy = { kind: "not_required" };

describe("summarizeJourneys", () => {
  test("a prerequisite beats urgency: the register comes before accepting residual risks", () => {
    // 2.4 is P0 and 2.3 is P1. Urgency alone named 2.4; the seed says 2.3 must come first.
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["2.4", "todo"],
          ["2.3", "todo"],
        ],
      }),
    );
    expect(summaries.get("c1")?.nextCode).toBe("2.3");
  });

  test("where nothing constrains it, urgency leads over process order", () => {
    // 12.1 (registration, P0) is in the last-numbered category; 1.2 (roles, P1) in the first.
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["1.2", "todo"],
          ["12.1", "todo"],
        ],
      }),
    );
    expect(summaries.get("c1")?.nextCode).toBe("12.1");
  });

  test("empty input yields an empty map", () => {
    expect(summarizeJourneys(new Map()).size).toBe(0);
  });

  test("counts done vs total and picks the first open step in journey order", () => {
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["12.1", "signed"],
          ["12.2", "started"],
          ["1.1", "todo"],
        ],
      }),
    );
    expect(summaries.get("c1")).toEqual({ total: 3, done: 1, nextCode: "12.2" });
  });

  test("signed and not applicable count as done; waiting for sign-off does not", () => {
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["12.1", "signed"],
          ["12.2", "na"],
          ["1.1", "awaiting"],
        ],
      }),
    );
    expect(summaries.get("c1")).toEqual({ total: 3, done: 2, nextCode: "1.1" });
  });

  test("a step waiting for its sign-off is named only when nothing else is open", () => {
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["12.1", "awaiting"],
          ["1.2", "todo"],
        ],
      }),
    );
    expect(summaries.get("c1")?.nextCode).toBe("1.2");
  });

  test("a requirement the walk covers, or no statute asks for, is never the next step", () => {
    // Onboarding seeds 12.1 as not started; for a company outside the registration duty the
    // journey shows it as not required, and the email must not name it.
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["12.1", "todo", NOT_REQUIRED],
          ["1.3", "awaiting", { kind: "walk", codes: ["1.1"] }],
          ["2.1", "todo"],
        ],
      }),
    );
    expect(summaries.get("c1")?.nextCode).toBe("2.1");
  });

  test("fully done journey has no next step", () => {
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["12.1", "signed"],
          ["12.2", "signed"],
        ],
      }),
    );
    expect(summaries.get("c1")).toEqual({ total: 2, done: 2, nextCode: null });
  });

  test("a code the journey does not know sinks behind every known one", () => {
    // Codes arrive from old emails and bookmarks; an unknown one must never be named as next
    // ahead of real work.
    const summaries = summarizeJourneys(
      journeys({
        c1: [
          ["99.9", "todo"],
          ["3.1", "todo"],
        ],
      }),
    );
    expect(summaries.get("c1")?.nextCode).toBe("3.1");
  });

  test("ties between unknown codes break deterministically by code", () => {
    const a = summarizeJourneys(
      journeys({
        c1: [
          ["Z-REQ", "todo"],
          ["A-REQ", "todo"],
        ],
      }),
    );
    const b = summarizeJourneys(
      journeys({
        c1: [
          ["A-REQ", "todo"],
          ["Z-REQ", "todo"],
        ],
      }),
    );
    expect(a.get("c1")?.nextCode).toBe("A-REQ");
    expect(b.get("c1")?.nextCode).toBe("A-REQ");
  });

  test("companies are summarized independently", () => {
    const summaries = summarizeJourneys(
      journeys({ c1: [["12.1", "signed"]], c2: [["12.1", "todo"]] }),
    );
    expect(summaries.get("c1")).toEqual({ total: 1, done: 1, nextCode: null });
    expect(summaries.get("c2")).toEqual({ total: 1, done: 0, nextCode: "12.1" });
  });
});
