/**
 * The card reads the server's refusal from NextAuth's `code`, matched whole: a refusal that only
 * resembles another (TWO_FACTOR_SETUP_REQUIRED holds TWO_FACTOR_REQUIRED's words) never reads as it.
 */
import { describe, expect, test } from "bun:test";
import { codeStepAfter, readSignInResult } from "./two-factor-sign-in";

const refused = (code: string | null) => ({ error: "CredentialsSignin", code });

describe("readSignInResult", () => {
  test("no error is a sign-in", () => {
    expect(readSignInResult({ error: null, code: null })).toBe("ok");
  });

  test("each refusal reads as its own result", () => {
    expect(readSignInResult(refused("RATE_LIMITED"))).toBe("rateLimited");
    expect(readSignInResult(refused("TWO_FACTOR_REQUIRED"))).toBe("codeRequired");
    expect(readSignInResult(refused("TWO_FACTOR_SETUP_REQUIRED"))).toBe("setupRequired");
    expect(readSignInResult(refused("TWO_FACTOR_INVALID"))).toBe("invalid");
    expect(readSignInResult(refused("TWO_FACTOR_LOCKED"))).toBe("locked");
    expect(readSignInResult(refused("TWO_FACTOR_UNREADABLE"))).toBe("unreadable");
  });

  test("a wrong password, an unverified address or an unknown code failed", () => {
    expect(readSignInResult(refused(null))).toBe("failed");
    expect(readSignInResult(refused("credentials"))).toBe("failed");
    expect(readSignInResult(refused("EMAIL_NOT_VERIFIED"))).toBe("failed");
    expect(readSignInResult(refused("TWO_FACTOR_REQUIRED_SOON"))).toBe("failed");
    expect(readSignInResult(refused("constructor"))).toBe("failed");
    expect(readSignInResult(undefined)).toBe("failed");
  });
});

test("codeStepAfter sends a needed code to its step and nothing else", () => {
  expect(codeStepAfter(refused("TWO_FACTOR_REQUIRED"))).toBe("code");
  expect(codeStepAfter(refused("TWO_FACTOR_SETUP_REQUIRED"))).toBe("setup");
  expect(codeStepAfter(refused("TWO_FACTOR_INVALID"))).toBeNull();
  expect(codeStepAfter({ error: null })).toBeNull();
});
