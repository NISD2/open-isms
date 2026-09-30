import { describe, expect, test } from "bun:test";
import {
  answerSaveChange,
  MANUAL_STATUSES,
  REOPEN_APPROVED_FIRST,
} from "./manual-status";

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

describe("answerSaveChange", () => {
  test("refuses a save that would reopen an approved requirement without review access", () => {
    expect(answerSaveChange(["in_progress", "approved"], false)).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: REOPEN_APPROVED_FIRST,
    });
  });

  test("lets someone with review access reopen an approved requirement by saving", () => {
    expect(answerSaveChange(["approved"], true)).toEqual({ ok: true });
  });

  // A member reopening their own completed work is ordinary editing, which
  // makeSignable in the e2e suite relies on.
  test.each([
    "not_started",
    "in_progress",
    "completed",
    "not_applicable",
    "needs_review",
    "rejected",
  ] as const)("lets anyone save over a %s requirement", (status) => {
    expect(answerSaveChange([status], false)).toEqual({ ok: true });
  });
});
