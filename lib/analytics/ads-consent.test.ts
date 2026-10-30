import { describe, expect, test } from "bun:test";
import { bannerVisible, hasAdClickId, parseConsent } from "./ads-consent";

describe("hasAdClickId", () => {
  test("any of Google's three click IDs counts, with or without other tags", () => {
    expect(hasAdClickId("?gclid=abc")).toBe(true);
    expect(hasAdClickId("?utm_source=google&gbraid=abc")).toBe(true);
    expect(hasAdClickId("?wbraid=abc&utm_term=nis2")).toBe(true);
  });

  test("campaign tags alone are not a click ID, so organic and utm-only visitors are not asked", () => {
    expect(hasAdClickId("")).toBe(false);
    expect(hasAdClickId("?utm_source=google&utm_medium=cpc")).toBe(false);
    expect(hasAdClickId("?gclid=")).toBe(false);
  });
});

describe("parseConsent", () => {
  test("only the two answers we write are believed", () => {
    expect(parseConsent("granted")).toBe("granted");
    expect(parseConsent("denied")).toBe("denied");
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("yes")).toBeNull();
  });
});

describe("bannerVisible", () => {
  test("asked once, and only on arrival with a click ID", () => {
    expect(bannerVisible({ consent: null, search: "?gclid=a", reopened: false })).toBe(
      true,
    );
    expect(bannerVisible({ consent: null, search: "", reopened: false })).toBe(false);
    expect(
      bannerVisible({ consent: "denied", search: "?gclid=a", reopened: false }),
    ).toBe(false);
    expect(
      bannerVisible({ consent: "granted", search: "?gclid=a", reopened: false }),
    ).toBe(false);
  });

  test("the footer link brings it back for anyone, whatever they answered", () => {
    expect(bannerVisible({ consent: "granted", search: "", reopened: true })).toBe(true);
    expect(bannerVisible({ consent: "denied", search: "", reopened: true })).toBe(true);
  });
});
