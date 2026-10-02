/**
 * The journey's next step moves past what waits for management's sign-off, the way the
 * walkthrough resumes, and comes back to it once nothing else is left, so the path never reads
 * "all done" while signatures are missing.
 */
import { describe, expect, test } from "bun:test";
import { type JourneyItem, liveNode } from "./views";

const item = (code: string, status: string, awaitingSignOff = false): JourneyItem => ({
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
  awaitingSignOff,
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
