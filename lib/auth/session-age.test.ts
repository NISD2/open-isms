import { describe, expect, test } from "bun:test";
import {
  epochSeconds,
  isWithinAbsoluteSessionAge,
  SESSION_ABSOLUTE_MAX_AGE_S,
} from "./session-age";

const SIGNED_IN = epochSeconds(new Date("2026-09-30T08:00:00Z"));
const HOUR = 60 * 60;

describe("the absolute session age", () => {
  test("is twelve hours", () => {
    expect(SESSION_ABSOLUTE_MAX_AGE_S).toBe(12 * HOUR);
  });

  test("accepts a fresh sign-in", () => {
    expect(isWithinAbsoluteSessionAge(SIGNED_IN, SIGNED_IN)).toBe(true);
  });

  test("accepts one second before the limit", () => {
    expect(isWithinAbsoluteSessionAge(SIGNED_IN, SIGNED_IN + 12 * HOUR - 1)).toBe(true);
  });

  // However often the token was re-signed in between: the stamp does not move.
  test("rejects a sign-in exactly twelve hours old", () => {
    expect(isWithinAbsoluteSessionAge(SIGNED_IN, SIGNED_IN + 12 * HOUR)).toBe(false);
  });

  test("rejects an older one", () => {
    expect(isWithinAbsoluteSessionAge(SIGNED_IN, SIGNED_IN + 30 * HOUR)).toBe(false);
  });

  test("rejects a token issued before the stamp existed", () => {
    expect(isWithinAbsoluteSessionAge(null, SIGNED_IN)).toBe(false);
  });
});

describe("epochSeconds", () => {
  test("drops the milliseconds", () => {
    expect(epochSeconds(new Date(1_790_000_000_999))).toBe(1_790_000_000);
  });
});
