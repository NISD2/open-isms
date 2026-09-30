import { describe, expect, test } from "bun:test";
import { MANUAL_STATUSES, manualStatusChange } from "./manual-status";

describe("MANUAL_STATUSES", () => {
  // needs_review is the deadline cron's to write; approved and rejected are
  // a reviewer's. None of them may arrive as a hand-set target.
  test("leaves out every status someone else decides", () => {
    for (const status of ["needs_review", "approved", "rejected"]) {
      expect(MANUAL_STATUSES).not.toContain(status);
    }
  });

  // sign-off-completion.ts documents completing without a signature as
  // intended, so the rule must not quietly take it away.
  test("still lets a person mark a requirement completed or not applicable", () => {
    expect(MANUAL_STATUSES).toContain("completed");
    expect(MANUAL_STATUSES).toContain("not_applicable");
  });
});

describe("manualStatusChange", () => {
  test("refuses to move an approved requirement", () => {
    const change = manualStatusChange("approved");
    expect(change.ok).toBe(false);
    if (!change.ok) expect(change.message).toContain("reopened");
  });

  test.each([
    "not_started",
    "in_progress",
    "completed",
    "not_applicable",
    "needs_review",
    "rejected",
  ] as const)("allows a change from %s", (current) => {
    expect(manualStatusChange(current)).toEqual({ ok: true });
  });
});
