import { describe, expect, test } from "bun:test";
import {
  effectiveSignOffRole,
  signerMeetsRequiredRole,
  signerRoleOf,
} from "./signer-role";

describe("signerRoleOf", () => {
  test("takes the job title, else the membership role", () => {
    expect(signerRoleOf({ jobTitle: "ciso", role: "admin" })).toBe("ciso");
    expect(signerRoleOf({ jobTitle: null, role: "admin" })).toBe("admin");
  });
});

describe("effectiveSignOffRole", () => {
  test("uses the role the requirement names", () => {
    expect(effectiveSignOffRole("ceo")).toBe("ceo");
  });

  // An unnamed signer must not mean "anyone may sign".
  test("falls back to the platform default when none is named", () => {
    expect(effectiveSignOffRole(null)).toBe("ciso");
  });
});

describe("signerMeetsRequiredRole", () => {
  const check = (signerRole: string, requiredSignOffRole: string | null) =>
    signerMeetsRequiredRole({ signerRole, requiredSignOffRole });

  test("admits the named signer", () => {
    expect(check("ceo", "ceo")).toBe(true);
    expect(check("dpo", "dpo")).toBe(true);
  });

  test("refuses a signer who does not hold the named role", () => {
    expect(check("ciso", "ceo")).toBe(false);
    expect(check("cto", "ciso")).toBe(false);
  });

  test("applies the default when the requirement names no role", () => {
    expect(check("ciso", null)).toBe(true);
    expect(check("cto", null)).toBe(false);
  });

  // § 38 Abs. 1 BSIG: management implements and oversees the measures, so its
  // signature stands for any role's.
  test("admits management for any role", () => {
    expect(check("ceo", "ciso")).toBe(true);
    expect(check("ceo", null)).toBe(true);
  });

  // signerRoleOf falls back to the membership role when no job title is set.
  // Being an admin of the account is no compliance role.
  test("refuses an admin who holds no role the requirement names", () => {
    expect(check("admin", "ceo")).toBe(false);
    expect(check("admin", null)).toBe(false);
  });

  // Job titles are free text. An arbitrary one must not satisfy a named role.
  test("does not admit an arbitrary job title", () => {
    expect(check("Head of Everything", "ceo")).toBe(false);
    expect(check("Head of Everything", null)).toBe(false);
  });
});
