import { describe, expect, test } from "bun:test";
import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import {
  completedSignOffValues,
  effectiveSignOffRole,
  signerMeetsRequiredRole,
  snapshotForVersion,
} from "./sign-off-completion";

const snapshot = (templateVersion: number): SignOffSnapshot => ({
  templateVersion,
  derivedData: { asset: { total: 12 } },
  companyProfile: { cisoName: "A. Beispiel" },
});

describe("completedSignOffValues", () => {
  const now = new Date("2026-08-23T10:00:00.000Z");
  const values = completedSignOffValues({
    userId: "user-1",
    signedOffRole: "ciso",
    templateVersion: 3,
    snapshot: snapshot(3),
    now,
  });

  // The regression this helper exists for: bulkConfirmModuleRef wrote every
  // other column and silently left this one null, so rows signed through it
  // carried no record of which requirement text was signed.
  test("records the template version that was signed", () => {
    expect(values.signedOffTemplateVersion).toBe(3);
  });

  test("writes every column the sign-off contract requires", () => {
    expect(Object.keys(values).sort()).toEqual([
      "completedAt",
      "completedBy",
      "signOffSnapshot",
      "signedOffAt",
      "signedOffBy",
      "signedOffRole",
      "signedOffTemplateVersion",
      "status",
      "updatedAt",
    ]);
  });

  test("attributes completion and sign-off to the same user", () => {
    expect(values.completedBy).toBe("user-1");
    expect(values.signedOffBy).toBe("user-1");
    expect(values.status).toBe("completed");
  });

  // The old hand-written writes each called new Date() per field, so a row
  // could carry three timestamps a millisecond apart.
  test("stamps one instant across every timestamp", () => {
    expect(values.completedAt).toBe(now);
    expect(values.signedOffAt).toBe(now);
    expect(values.updatedAt).toBe(now);
  });
});

describe("snapshotForVersion", () => {
  test("re-stamps the version and keeps the company-scoped half", () => {
    const base = snapshot(1);
    const restamped = snapshotForVersion(base, 7);

    expect(restamped.templateVersion).toBe(7);
    expect(restamped.derivedData).toEqual(base.derivedData);
    expect(restamped.companyProfile).toEqual(base.companyProfile);
  });

  // A batch re-stamps one base snapshot per row. If that aliased the base,
  // each row would overwrite the previous row's version.
  test("does not mutate the base it re-stamps", () => {
    const base = snapshot(1);
    snapshotForVersion(base, 7);
    snapshotForVersion(base, 9);

    expect(base.templateVersion).toBe(1);
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
  const check = (signerRole: string, requiredSignOffRole: string | null, sessionRole = "member") =>
    signerMeetsRequiredRole({ sessionRole, signerRole, requiredSignOffRole });

  test("admits the named signer", () => {
    expect(check("ceo", "ceo")).toBe(true);
  });

  test("refuses a signer who does not hold the named role", () => {
    expect(check("ciso", "ceo")).toBe(false);
  });

  test("applies the default when the requirement names no role", () => {
    expect(check("ciso", null)).toBe(true);
    expect(check("ceo", null)).toBe(false);
  });

  // Matches the single sign-off path, which lets an admin close a
  // requirement without holding its role.
  test("lets an admin session bypass the role", () => {
    expect(check("ciso", "ceo", "admin")).toBe(true);
  });

  // getSignerRole returns user.jobTitle, which is free text. An arbitrary
  // job title must not satisfy a named role.
  test("does not admit an arbitrary job title", () => {
    expect(check("Head of Everything", "ceo")).toBe(false);
    expect(check("Head of Everything", null)).toBe(false);
  });
});
