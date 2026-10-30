/**
 * The settings an admin saves are the company table's own rules, picked; these pin the boundaries
 * the hand-written copy had, so deriving it never let a longer or malformed value through.
 */
import { describe, expect, test } from "bun:test";
import { companySettingsSchema } from "./company-settings";

const accepts = (input: Record<string, unknown>) =>
  companySettingsSchema.safeParse(input).success;
const chars = (n: number) => "a".repeat(n);

describe("companySettingsSchema", () => {
  test("every field is optional", () => {
    expect(accepts({})).toBe(true);
  });

  test("text fields stop at their column length", () => {
    const limits = {
      name: 255,
      sector: 255,
      legalForm: 100,
      cisoName: 255,
      cisoReportsTo: 255,
      bsiContactName: 255,
      bsiContactPhone: 50,
      bsiRegistrationId: 100,
      primaryLocations: 1000,
    } as const;
    for (const [field, max] of Object.entries(limits)) {
      expect({ field, ok: accepts({ [field]: chars(max) }) }).toEqual({
        field,
        ok: true,
      });
      expect({ field, ok: accepts({ [field]: chars(max + 1) }) }).toEqual({
        field,
        ok: false,
      });
    }
  });

  test("the name and sector cannot be blanked or nulled", () => {
    for (const field of ["name", "sector"]) {
      expect(accepts({ [field]: "" })).toBe(false);
      expect(accepts({ [field]: null })).toBe(false);
    }
  });

  test("the optional facts can be cleared", () => {
    for (const field of [
      "legalForm",
      "employeeCount",
      "contactEmail",
      "bsiContactEmail",
    ]) {
      expect(accepts({ [field]: null })).toBe(true);
    }
  });

  test("both email addresses must be addresses", () => {
    for (const field of ["contactEmail", "bsiContactEmail"]) {
      expect(accepts({ [field]: "ciso@example.com" })).toBe(true);
      expect(accepts({ [field]: "not an address" })).toBe(false);
    }
    expect(accepts({ bsiContactEmail: `${chars(250)}@example.com` })).toBe(false);
  });

  test("the head count is a positive whole number", () => {
    expect(accepts({ employeeCount: 50 })).toBe(true);
    expect(accepts({ employeeCount: 0 })).toBe(false);
    expect(accepts({ employeeCount: 1.5 })).toBe(false);
  });

  test("the security budget is a number the column can hold", () => {
    expect(accepts({ annualSecurityBudget: "25000.50" })).toBe(true);
    expect(accepts({ annualSecurityBudget: "ca. 25k" })).toBe(false);
  });

  test("the entity type and AI setting are their enums", () => {
    expect(accepts({ entityType: "important" })).toBe(true);
    expect(accepts({ entityType: "other" })).toBe(false);
    expect(accepts({ aiDataSharing: "none" })).toBe(true);
    expect(accepts({ aiDataSharing: "everything" })).toBe(false);
  });

  test("the country is one on the portal list, and cannot be cleared", () => {
    expect(accepts({ country: "DE" })).toBe(true);
    expect(accepts({ country: "US" })).toBe(false);
    expect(accepts({ country: null })).toBe(false);
  });

  test("columns an admin does not set here are dropped", () => {
    const parsed = companySettingsSchema.parse({
      name: "Muster GmbH",
      ownerId: "x",
      plan: "pro",
    });
    expect(parsed).toEqual({ name: "Muster GmbH" });
  });
});
