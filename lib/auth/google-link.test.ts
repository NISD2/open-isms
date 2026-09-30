import { describe, expect, test } from "bun:test";
import {
  decideGoogleLink,
  GOOGLE_SIGNIN_ERRORS,
  type GoogleLinkAccount,
  googleSignInErrorPath,
  isGoogleSignInError,
} from "./google-link";

const SUB = "108234567890123456789";
const OTHER_SUB = "109876543210987654321";
const VERIFIED = new Date("2026-09-01T08:00:00Z");

const account = (overrides: Partial<GoogleLinkAccount>): GoogleLinkAccount => ({
  googleSubject: null,
  passwordHash: null,
  emailVerifiedAt: null,
  ...overrides,
});

describe("an account already linked to a Google account", () => {
  test("lets the same Google account in and changes nothing", () => {
    expect(
      decideGoogleLink(account({ googleSubject: SUB, emailVerifiedAt: VERIFIED }), SUB),
    ).toEqual({ kind: "sign-in" });
  });

  test("still lets it in when a password was set later through a reset", () => {
    expect(
      decideGoogleLink(
        account({ googleSubject: SUB, passwordHash: "hash", emailVerifiedAt: VERIFIED }),
        SUB,
      ),
    ).toEqual({ kind: "sign-in" });
  });

  // The takeover: a second Google account claiming the same verified address.
  test("refuses a different Google account on the same address", () => {
    expect(
      decideGoogleLink(
        account({ googleSubject: SUB, emailVerifiedAt: VERIFIED }),
        OTHER_SUB,
      ),
    ).toEqual({ kind: "refuse", error: GOOGLE_SIGNIN_ERRORS.subjectMismatch });
  });
});

describe("an account not yet linked", () => {
  test("refuses Google on a verified password account and keeps the password", () => {
    expect(
      decideGoogleLink(account({ passwordHash: "hash", emailVerifiedAt: VERIFIED }), SUB),
    ).toEqual({ kind: "refuse", error: GOOGLE_SIGNIN_ERRORS.passwordAccount });
  });

  // A stranger registered the address first and never verified it.
  test("links an unverified password account, clearing the password and verifying", () => {
    expect(decideGoogleLink(account({ passwordHash: "hash" }), SUB)).toEqual({
      kind: "link",
      clearPassword: true,
      markVerified: true,
    });
  });

  test("links a verified account with no password (a Google account from before the column)", () => {
    expect(decideGoogleLink(account({ emailVerifiedAt: VERIFIED }), SUB)).toEqual({
      kind: "link",
      clearPassword: false,
      markVerified: false,
    });
  });

  test("links an unverified account with no password and verifies it", () => {
    expect(decideGoogleLink(account({}), SUB)).toEqual({
      kind: "link",
      clearPassword: false,
      markVerified: true,
    });
  });
});

describe("the codes the sign-in card reads", () => {
  test("round-trip through the redirect path", () => {
    const path = googleSignInErrorPath(GOOGLE_SIGNIN_ERRORS.passwordAccount);
    const code = new URL(path, "https://example.test").searchParams.get("error");
    expect(new URL(path, "https://example.test").pathname).toBe("/auth/signin");
    expect(isGoogleSignInError(code)).toBe(true);
  });

  test("the changed-address refusal is one of them", () => {
    const path = googleSignInErrorPath(GOOGLE_SIGNIN_ERRORS.emailChanged);
    const code = new URL(path, "https://example.test").searchParams.get("error");
    expect(code).toBe("GOOGLE_EMAIL_CHANGED");
    expect(isGoogleSignInError(code)).toBe(true);
  });

  test("anything else is not one of them", () => {
    expect(isGoogleSignInError("AccessDenied")).toBe(false);
    expect(isGoogleSignInError(null)).toBe(false);
  });
});
