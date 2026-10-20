import { describe, expect, test } from "bun:test";
import { cancelWindow } from "./money-back-window";

describe("cancelWindow", () => {
  const first = { issueDate: "2026-09-01", firstInvoice: true, waived: false } as const;
  const later = { issueDate: "2026-09-01", firstInvoice: false, waived: false } as const;

  test("a confirmed first export or sign-off ends the money back inside the thirty days", () => {
    expect(
      cancelWindow({ ...first, waived: true }, new Date("2026-09-05T10:00:00Z")),
    ).toEqual({ kind: "renewal", day: 4, reason: "money_back_waived" });
    // After the thirty days the reason stays that they passed.
    expect(
      cancelWindow({ ...first, waived: true }, new Date("2026-10-05T10:00:00Z")),
    ).toMatchObject({ kind: "renewal", reason: "window_passed" });
  });

  test("the first invoice: the order day is day 0 and inside the thirty days", () => {
    expect(cancelWindow(first, new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "money_back",
      day: 0,
      lastDay: "2026-10-01",
    });
  });

  test("the first invoice: the thirtieth day is still inside, the next is not", () => {
    expect(cancelWindow(first, new Date("2026-10-01T20:00:00Z")).kind).toBe("money_back");
    expect(cancelWindow(first, new Date("2026-10-02T08:00:00Z"))).toEqual({
      kind: "renewal",
      day: 31,
      reason: "window_passed",
    });
  });

  test("a later invoice never has money back, even on its order day", () => {
    expect(cancelWindow(later, new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "renewal",
      day: 0,
      reason: "not_first_invoice",
    });
    expect(cancelWindow(later, new Date("2026-09-15T10:00:00Z"))).toEqual({
      kind: "renewal",
      day: 14,
      reason: "not_first_invoice",
    });
  });

  test("the day is counted in Berlin, not on the server's clock", () => {
    // 22:30 UTC on the 1st of October is already the 2nd in Berlin.
    expect(cancelWindow(first, new Date("2026-10-01T22:30:00Z")).kind).toBe("renewal");
  });
});
