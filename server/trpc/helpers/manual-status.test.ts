import { describe, expect, test } from "bun:test";
import {
  answerSaveChange,
  MANUAL_STATUSES,
  REOPEN_APPROVED_FIRST,
  WORK_STATUSES,
} from "./manual-status";

describe("MANUAL_STATUSES", () => {
  // needs_review is the deadline cron's to write; approved and rejected are
  // a reviewer's. None of them may arrive as a hand-set target.
  test("leaves out every status someone else decides", () => {
    for (const status of ["needs_review", "approved", "rejected"]) {
      expect(MANUAL_STATUSES).not.toContain(status);
    }
  });

  // Done is a signature, never a status someone sets.
  test("leaves out completed", () => {
    expect(MANUAL_STATUSES).not.toContain("completed");
  });

  test("keeps not applicable, which needs a reason and a signer", () => {
    expect(MANUAL_STATUSES).toContain("not_applicable");
    expect(WORK_STATUSES).not.toContain("not_applicable");
  });

  test("lists every work status as a hand-set status", () => {
    for (const status of WORK_STATUSES) expect(MANUAL_STATUSES).toContain(status);
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
