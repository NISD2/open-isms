/**
 * The journey's next step moves past what waits for management's sign-off, the way the
 * walkthrough resumes, and comes back to it once nothing else is left, so the path never reads
 * "all done" while signatures are missing.
 */
import { describe, expect, test } from "bun:test";
import { journeyState } from "@/lib/compliance/journey-position";
import { type JourneyItem, liveNode } from "./views";

/** An item; `filled` is the walkthrough having it filled in. */
const item = (code: string, status: string, filled = false): JourneyItem => ({
  id: code,
  code,
  title: code,
  description: null,
  categoryCode: "X",
  categorySlug: "x",
  status,
  priority: null,
  frequency: null,
  legalRef: null,
  frameworkRef: null,
  requiredSignOffRole: null,
  dueAt: null,
  dueInDays: null,
  signedOffAt: null,
  sortOrder: 0,
  signOff: { signed: 0, total: 0 },
  state: journeyState(status, filled ? { kind: "filled", since: new Date(0) } : null),
});

describe("the journey's next step", () => {
  test("is the first item in journey order that is neither done nor waiting for sign-off", () => {
    const items = [
      item("2.1", "not_started"),
      item("12.2", "in_progress", true),
      item("12.1", "completed"),
      item("1.1", "not_started"),
    ];
    expect(liveNode(items)?.code).toBe("1.1");
  });

  test("moves past an item due to be signed again, like one filled in, unless it is overdue", () => {
    const items = [item("12.2", "needs_review"), item("1.1", "in_progress")];
    expect(liveNode(items)?.code).toBe("1.1");
    const overdue = [
      { ...item("12.2", "needs_review"), dueInDays: -40 },
      item("1.1", "in_progress"),
    ];
    expect(liveNode(overdue)?.code).toBe("12.2");
  });

  test("falls back to the first item waiting for sign-off when nothing else is left", () => {
    const items = [
      item("2.1", "in_progress", true),
      item("12.2", "in_progress", true),
      item("12.1", "completed"),
    ];
    expect(liveNode(items)?.code).toBe("12.2");
  });

  test("is nothing once every item is done", () => {
    expect(
      liveNode([item("12.1", "completed"), item("12.2", "not_applicable")]),
    ).toBeNull();
  });
});

describe("a requirement's state on the journey", () => {
  test("reads waiting for sign-off from the walkthrough and from a review that is due", () => {
    const filled = { kind: "filled", since: new Date(0) } as const;
    expect(journeyState("in_progress", filled)).toBe("awaiting");
    expect(journeyState("rejected", filled)).toBe("awaiting");
    expect(journeyState("needs_review", null)).toBe("awaiting");
    // Set aside in the walkthrough since: the approval does not list it, so neither does this.
    expect(
      journeyState("needs_review", {
        kind: "waiting",
        reason: "ask",
        since: new Date(0),
      }),
    ).toBe("todo");
    expect(journeyState("completed", filled)).toBe("signed");
    expect(journeyState("not_applicable", null)).toBe("na");
    expect(journeyState("in_progress", { kind: "open" })).toBe("started");
    expect(journeyState("rejected", null)).toBe("rejected");
    expect(journeyState("not_started", null)).toBe("todo");
  });
});
