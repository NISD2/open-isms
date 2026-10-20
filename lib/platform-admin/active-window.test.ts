import { describe, expect, test } from "bun:test";
import {
  clampActiveDays,
  DEFAULT_ACTIVE_DAYS,
  MAX_ACTIVE_DAYS,
  QUICK_ACTIVE_DAYS,
} from "./active-window";

describe("the active window", () => {
  test("defaults to fourteen days, and every quick button is a window the procedure accepts", () => {
    expect(DEFAULT_ACTIVE_DAYS).toBe(14);
    for (const days of QUICK_ACTIVE_DAYS) {
      expect(clampActiveDays(String(days))).toBe(days);
    }
  });

  test("reads a typed number as itself", () => {
    expect(clampActiveDays("365")).toBe(365);
    expect(clampActiveDays(" 30 ")).toBe(30);
  });

  test("clamps a number outside 1 to the most, and cuts a decimal", () => {
    expect(clampActiveDays("0")).toBe(1);
    expect(clampActiveDays("-5")).toBe(1);
    expect(clampActiveDays("9999")).toBe(MAX_ACTIVE_DAYS);
    expect(clampActiveDays("2.9")).toBe(2);
  });

  test("leaves the window alone for an empty or non-numeric field", () => {
    expect(clampActiveDays("")).toBeNull();
    expect(clampActiveDays("   ")).toBeNull();
    expect(clampActiveDays("abc")).toBeNull();
    expect(clampActiveDays("Infinity")).toBeNull();
  });
});
