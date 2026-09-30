import { describe, expect, test } from "bun:test";
import { hasSignOffToWithdraw, reopenChange } from "./sign-off-state";

const SIGNED_AT = new Date("2026-09-01");
// What the requirement page receives: the loader serialises the timestamp.
const SIGNED_AT_ON_PAGE = SIGNED_AT.toISOString();

describe("hasSignOffToWithdraw", () => {
  // The module recheck and the deadline cron move a signed requirement to
  // needs_review and keep its signature, snapshot and receipts.
  test.each([
    ["on the server", SIGNED_AT],
    ["on the page", SIGNED_AT_ON_PAGE],
  ])("counts a needs_review row that still carries a signature, %s", (_, signedOffAt) => {
    expect(hasSignOffToWithdraw({ status: "needs_review", signedOffAt })).toBe(true);
  });

  // The cron also moves not_applicable rows to needs_review, and marking a row
  // not applicable sets no signature: signing it is the way forward.
  test("does not count a needs_review row without a signature", () => {
    expect(hasSignOffToWithdraw({ status: "needs_review", signedOffAt: null })).toBe(
      false,
    );
  });

  test("counts a done row even without a signature", () => {
    expect(hasSignOffToWithdraw({ status: "completed", signedOffAt: null })).toBe(true);
  });

  test("does not count an unsigned in_progress row", () => {
    expect(hasSignOffToWithdraw({ status: "in_progress", signedOffAt: null })).toBe(
      false,
    );
  });
});

describe("reopenChange", () => {
  test("reopens a needs_review row that still carries a signature", () => {
    const row = { status: "needs_review", signedOffAt: SIGNED_AT_ON_PAGE };
    expect(reopenChange(row, false)).toEqual({ ok: true });
  });

  test("refuses a needs_review row without a signature", () => {
    const row = { status: "needs_review", signedOffAt: null };
    expect(reopenChange(row, true)).toMatchObject({ ok: false, code: "BAD_REQUEST" });
  });

  test("refuses a row with nothing to reopen", () => {
    const row = { status: "in_progress", signedOffAt: null };
    expect(reopenChange(row, true)).toMatchObject({ ok: false, code: "BAD_REQUEST" });
  });

  test("refuses an approved row without review access, allows it with", () => {
    const approved = { status: "approved", signedOffAt: SIGNED_AT };
    expect(reopenChange(approved, false)).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(reopenChange(approved, true)).toEqual({ ok: true });
  });
});
