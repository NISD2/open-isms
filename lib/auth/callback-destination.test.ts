import { describe, expect, test } from "bun:test";
import { callbackDestination } from "./callback-destination";

describe("callbackDestination", () => {
  test("names nothing without a usable callbackUrl", () => {
    expect(callbackDestination(undefined)).toBeNull();
    expect(callbackDestination("")).toBeNull();
    expect(callbackDestination("//evil.tld/training")).toBeNull();
    expect(callbackDestination("https://evil.tld/training")).toBeNull();
    expect(callbackDestination("/\\evil.tld")).toBeNull();
  });

  test("reads the course, with or without a language in front", () => {
    expect(callbackDestination("/training/courses/nis2-ceo/0.1")).toBe("course");
    expect(callbackDestination("/en/training/nis2-ceo?download=1")).toBe("course");
    expect(callbackDestination("/de/training/courses/nis2-ceo")).toBe("course");
  });

  test("reads the walkthrough under both slugs, and the dashboard that opens it", () => {
    expect(callbackDestination("/durchgang/nis2/12.2")).toBe("walkthrough");
    expect(callbackDestination("/en/walkthrough/nis2")).toBe("walkthrough");
    expect(callbackDestination("/dashboard")).toBe("walkthrough");
  });

  test("reads the order page in every language's slug", () => {
    expect(callbackDestination("/bestellen")).toBe("order");
    expect(callbackDestination("/en/order")).toBe("order");
    expect(callbackDestination("/fr/commander")).toBe("order");
  });

  test("reads billing, the supplier questionnaire and the assistant connection", () => {
    expect(callbackDestination("/billing")).toBe("billing");
    expect(callbackDestination("/sicherheitsfragebogen")).toBe("supplierQuestionnaire");
    expect(callbackDestination("/portal/supplier-onboarding")).toBe(
      "supplierQuestionnaire",
    );
    expect(callbackDestination("/mcp/verbinden/anything")).toBe("assistant");
  });

  test("a credential link is only ever 'link', whatever else its path looks like", () => {
    expect(callbackDestination("/invite/abc123")).toBe("link");
    expect(callbackDestination("/de/supplier-invite/abc123")).toBe("link");
    expect(callbackDestination("/auth/setup?token=abc123")).toBe("link");
    expect(callbackDestination("/partner-agreement/abc123")).toBe("link");
    expect(callbackDestination("/gap-assessment/share/abc123")).toBe("link");
  });

  test("anything else is 'other'", () => {
    expect(callbackDestination("/wiki/umsetzung/nis2-roadmap")).toBe("other");
    expect(callbackDestination("/settings")).toBe("other");
  });
});
