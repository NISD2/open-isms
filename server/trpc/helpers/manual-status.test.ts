import { describe, expect, test } from "bun:test";
import {
  answerSaveChange,
  hasSignOffToWithdraw,
  MANUAL_STATUSES,
  REOPEN_APPROVED_FIRST,
  reopenChange,
} from "./manual-status";

const SIGNED_AT = new Date("2026-09-01");

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

describe("hasSignOffToWithdraw", () => {
  // The module recheck moves a signed requirement to needs_review and keeps
  // its signature, snapshot and receipts.
  test("counts a needs_review row that still carries a signature", () => {
    expect(hasSignOffToWithdraw({ status: "needs_review", signedOffAt: SIGNED_AT })).toBe(
      true,
    );
  });

  test("counts a done row even without a signature", () => {
    expect(hasSignOffToWithdraw({ status: "completed", signedOffAt: null })).toBe(true);
  });

  test.each(["in_progress", "needs_review"] as const)(
    "does not count an unsigned %s row",
    (status) => {
      expect(hasSignOffToWithdraw({ status, signedOffAt: null })).toBe(false);
    },
  );
});

describe("reopenChange", () => {
  test("reopens a needs_review row that still carries a signature", () => {
    const row = { status: "needs_review", signedOffAt: SIGNED_AT } as const;
    expect(reopenChange(row, false)).toEqual({ ok: true });
  });

  test("refuses a row with nothing to reopen", () => {
    const row = { status: "in_progress", signedOffAt: null } as const;
    expect(reopenChange(row, true)).toMatchObject({ ok: false, code: "BAD_REQUEST" });
  });

  test("refuses an approved row without review access, allows it with", () => {
    const approved = { status: "approved", signedOffAt: SIGNED_AT } as const;
    expect(reopenChange(approved, false)).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(reopenChange(approved, true)).toEqual({ ok: true });
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
