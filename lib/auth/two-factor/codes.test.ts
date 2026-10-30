/**
 * What counts as a code: six digits from the app within a step of now, or a recovery code as
 * printed, read the way people copy them (spaces, dashes, capitals).
 */
import { describe, expect, test } from "bun:test";
import {
  currentCode,
  newAppSecret,
  newRecoveryCodes,
  normaliseRecoveryCode,
  RECOVERY_CODE_COUNT,
  readTypedCode,
  stepOfCode,
} from "./codes";

const NOW = Date.UTC(2026, 9, 30, 12, 0, 10);
const STEP_MS = 30_000;

describe("app codes", () => {
  const secret = newAppSecret();

  test("the current code matches the current step", () => {
    const step = stepOfCode(secret, currentCode(secret, NOW), NOW);
    expect(step).toBe(Math.floor(NOW / STEP_MS));
  });

  test("a code from one step ago still matches, for a phone clock a little off", () => {
    const previous = currentCode(secret, NOW - STEP_MS);
    expect(stepOfCode(secret, previous, NOW)).toBe(Math.floor(NOW / STEP_MS) - 1);
  });

  test("a code from two steps ago does not", () => {
    const old = currentCode(secret, NOW - 2 * STEP_MS);
    // A six-digit collision with a neighbouring step is possible but one in a million.
    expect(stepOfCode(secret, old, NOW)).toBeNull();
  });

  test("another secret's code does not match", () => {
    expect(stepOfCode(newAppSecret(), currentCode(secret, NOW), NOW)).toBeNull();
  });
});

describe("reading what was typed", () => {
  test("six digits, with or without a space in the middle, are an app code", () => {
    expect(readTypedCode("123456")).toEqual({ kind: "app", code: "123456" });
    expect(readTypedCode(" 123 456 ")).toEqual({ kind: "app", code: "123456" });
  });

  test("a recovery code is read with or without dashes and in any case", () => {
    const [shown] = newRecoveryCodes();
    const expected = { kind: "recovery", code: normaliseRecoveryCode(shown) };
    expect(readTypedCode(shown)).toEqual(expected);
    expect(readTypedCode(shown.toUpperCase().split("-").join(" "))).toEqual(expected);
  });

  test("anything else is neither", () => {
    for (const typed of ["", "12345", "1234567", "abcdef", "abcd-efgh-ijk0", undefined]) {
      expect(readTypedCode(typed).kind).toBe("none");
    }
  });
});

describe("recovery codes", () => {
  test("ten, all different, in the printed form", () => {
    const codes = newRecoveryCodes();
    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
    for (const code of codes) {
      const parts = code.split("-");
      expect(parts.map((p) => p.length)).toEqual([4, 4, 4]);
      expect(readTypedCode(code).kind).toBe("recovery");
    }
  });
});
