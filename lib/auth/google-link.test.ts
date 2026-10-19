import { describe, expect, test } from "bun:test";
import {
  decideGoogleLink,
  GOOGLE_SIGNIN_ERRORS,
  type GoogleLinkAccount,
  googleSignInErrorPath,
  isGoogleAuthoritative,
  isGoogleSignInError,
} from "./google-link";

const SUB = "108234567890123456789";
const OTHER_SUB = "109876543210987654321";
const VERIFIED = new Date("2026-09-01T08:00:00Z");

// A personal Google account on an address Google does not host: the stale-account case.
const GOOGLE = { subject: SUB, authoritative: false } as const;
// A Gmail address or a Workspace account: Google is the mailbox.
const AUTHORITATIVE = { subject: SUB, authoritative: true } as const;

const account = (overrides: Partial<GoogleLinkAccount>): GoogleLinkAccount => ({
  googleSubject: null,
  passwordHash: null,
  emailVerifiedAt: null,
  ...overrides,
});

describe("an account already linked to a Google account", () => {
  test("lets the same Google account in and changes nothing", () => {
    expect(
      decideGoogleLink(
        account({ googleSubject: SUB, emailVerifiedAt: VERIFIED }),
        GOOGLE,
      ),
    ).toEqual({ kind: "sign-in" });
  });

  test("still lets it in when a password was set later through a reset", () => {
    expect(
      decideGoogleLink(
        account({ googleSubject: SUB, passwordHash: "hash", emailVerifiedAt: VERIFIED }),
        GOOGLE,
      ),
    ).toEqual({ kind: "sign-in" });
  });

  // The takeover: a second Google account claiming the same verified address.
  test("refuses a different Google account on the same address", () => {
    for (const incoming of [GOOGLE, AUTHORITATIVE]) {
      expect(
        decideGoogleLink(account({ googleSubject: SUB, emailVerifiedAt: VERIFIED }), {
          ...incoming,
          subject: OTHER_SUB,
        }),
      ).toEqual({ kind: "refuse", error: GOOGLE_SIGNIN_ERRORS.subjectMismatch });
    }
  });
});

describe("an account not yet linked", () => {
  test("refuses Google on a verified password account where Google is not authoritative", () => {
    expect(
      decideGoogleLink(
        account({ passwordHash: "hash", emailVerifiedAt: VERIFIED }),
        GOOGLE,
      ),
    ).toEqual({ kind: "refuse", error: GOOGLE_SIGNIN_ERRORS.passwordAccount });
  });

  // The 19.10.2026 report: a password signup on a Gmail address could never use Google, and a
  // reset (which unlinks Google) shut Google out for good.
  test("links a verified password account where Google is authoritative, keeping the password", () => {
    expect(
      decideGoogleLink(
        account({ passwordHash: "hash", emailVerifiedAt: VERIFIED }),
        AUTHORITATIVE,
      ),
    ).toEqual({ kind: "link", clearPassword: false, markVerified: false });
  });

  // A stranger registered the address first and never verified it.
  test("links an unverified password account, clearing the password and verifying", () => {
    for (const incoming of [GOOGLE, AUTHORITATIVE]) {
      expect(decideGoogleLink(account({ passwordHash: "hash" }), incoming)).toEqual({
        kind: "link",
        clearPassword: true,
        markVerified: true,
      });
    }
  });

  test("links a verified account with no password (a Google account from before the column)", () => {
    expect(decideGoogleLink(account({ emailVerifiedAt: VERIFIED }), GOOGLE)).toEqual({
      kind: "link",
      clearPassword: false,
      markVerified: false,
    });
  });

  test("links an unverified account with no password and verifies it", () => {
    expect(decideGoogleLink(account({}), GOOGLE)).toEqual({
      kind: "link",
      clearPassword: false,
      markVerified: true,
    });
  });
});

describe("whether Google vouches for an address", () => {
  test("a Gmail address, in any case", () => {
    expect(isGoogleAuthoritative("someone@gmail.com", undefined)).toBe(true);
    expect(isGoogleAuthoritative("Someone@GMail.com", undefined)).toBe(true);
  });

  test("a Workspace account, whatever its domain", () => {
    expect(isGoogleAuthoritative("it@example.de", "example.de")).toBe(true);
  });

  test("not a personal Google account on someone else's mail domain", () => {
    expect(isGoogleAuthoritative("it@example.de", undefined)).toBe(false);
    expect(isGoogleAuthoritative("it@example.de", "")).toBe(false);
    expect(isGoogleAuthoritative("it@example.de", 42)).toBe(false);
  });

  test("not a look-alike of Gmail", () => {
    expect(isGoogleAuthoritative("someone@gmail.com.example.de", undefined)).toBe(false);
    expect(isGoogleAuthoritative("someone@notgmail.com", undefined)).toBe(false);
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
