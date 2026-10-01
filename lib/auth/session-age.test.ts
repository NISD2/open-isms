import { describe, expect, test } from "bun:test";
import {
  epochSeconds,
  isRecentSignIn,
  isSessionVersionCurrent,
  issuedToAccount,
  isWithinAbsoluteSessionAge,
  RECENT_SIGN_IN_S,
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

describe("the revocation counter", () => {
  test("a token at the stored version is current", () => {
    expect(isSessionVersionCurrent(3, 3)).toBe(true);
  });

  test("a token below it was revoked by a reset or a sign-out", () => {
    expect(isSessionVersionCurrent(2, 3)).toBe(false);
  });

  test("a token without one is revoked", () => {
    expect(isSessionVersionCurrent(null, 1)).toBe(false);
  });
});

describe("a token and the account it opens", () => {
  const account = "11111111-1111-4111-8111-111111111111";
  const erased = "22222222-2222-4222-8222-222222222222";

  test("a token issued to this account opens it", () => {
    expect(issuedToAccount(account, account)).toBe(true);
  });

  test("a token from an erased account under the same address does not", () => {
    expect(issuedToAccount(erased, account)).toBe(false);
  });

  test("a token from before the id was stamped is left to age out", () => {
    expect(issuedToAccount(null, account)).toBe(true);
  });
});

describe("a recent sign-in, for acts that cannot be undone", () => {
  test("a sign-in a few minutes ago counts", () => {
    expect(isRecentSignIn(SIGNED_IN, SIGNED_IN + 5 * 60)).toBe(true);
  });

  test("one older than the window does not", () => {
    expect(isRecentSignIn(SIGNED_IN, SIGNED_IN + RECENT_SIGN_IN_S)).toBe(false);
  });

  test("a token without a sign-in time does not", () => {
    expect(isRecentSignIn(null, SIGNED_IN)).toBe(false);
  });
});

describe("epochSeconds", () => {
  test("drops the milliseconds", () => {
    expect(epochSeconds(new Date(1_790_000_000_999))).toBe(1_790_000_000);
  });
});
