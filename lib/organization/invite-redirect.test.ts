import { describe, expect, test } from "bun:test";
import { inviteRedirectPath } from "./invite-redirect";

const PAGE = "https://nisd2.eu/de/invite/some-token";

describe("inviteRedirectPath", () => {
  test("keeps a stored same-origin path", () => {
    expect(inviteRedirectPath("/compliance/risk-management")).toBe(
      "/compliance/risk-management",
    );
  });

  test("lands on the start page when nothing was stored", () => {
    expect(inviteRedirectPath(null)).toBe("/");
  });

  // Rows written before the input check can hold anything, so the value is
  // checked again where the accept page uses it.
  test("never sends a legacy row off the origin", () => {
    for (const stored of [
      "https://evil.invalid/login",
      "//evil.invalid",
      "/\\evil.invalid",
      "/.//evil.invalid",
      "/\t/evil.invalid",
      "javascript:alert(1)",
    ]) {
      const out = inviteRedirectPath(stored);
      expect(out).toBe("/");
      expect(new URL(out, PAGE).origin).toBe("https://nisd2.eu");
    }
  });
});
