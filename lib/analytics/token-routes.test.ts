import { describe, expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";
import { analyticsBeforeSend, isTokenRoute, TOKEN_ROUTE_PREFIXES } from "./token-routes";

describe("isTokenRoute", () => {
  test("every listed prefix is a token route in every locale", () => {
    for (const prefix of TOKEN_ROUTE_PREFIXES) {
      expect(isTokenRoute(`${prefix}/abc`)).toBe(true);
      for (const locale of LOCALE_CODES) {
        expect(isTokenRoute(`/${locale}${prefix}/abc`)).toBe(true);
      }
    }
  });

  test("covers the credential-bearing pages", () => {
    for (const path of [
      "/auth/setup",
      "/de/auth/setup",
      "/invite/5f0c",
      "/EN/invite/5f0c",
      "/supplier-access/5f0c",
      "/supplier-invite/5f0c",
      "/nl/gap-assessment/share/5f0c",
      "/invite//5f0c",
    ]) {
      expect(isTokenRoute(path)).toBe(true);
    }
  });

  test("leaves every other page tracked", () => {
    for (const path of [
      "/",
      "/en",
      "/journey",
      "/auth/signin",
      "/auth/forgot-password",
      "/gap-assessment",
      "/gap-assessment/results",
      "/invitee",
      "/wiki/invite",
      "/supplier-portal",
    ]) {
      expect(isTokenRoute(path)).toBe(false);
    }
  });
});

describe("analyticsBeforeSend", () => {
  const event = (url: string, referrer = "") => ({
    website: "site",
    hostname: "nisd2.eu",
    url,
    referrer,
  });

  test("passes an ordinary page view through unchanged", () => {
    const payload = event("https://nisd2.eu/journey", "https://www.google.com/");
    expect(analyticsBeforeSend("event", payload)).toBe(payload);
  });

  test("drops a view of a token page, full URL or path", () => {
    expect(
      analyticsBeforeSend("event", event("https://nisd2.eu/invite/5f0c")),
    ).toBeNull();
    expect(analyticsBeforeSend("event", event("/en/supplier-access/5f0c"))).toBeNull();
  });

  test("blanks a referrer that was a token page", () => {
    expect(
      analyticsBeforeSend(
        "event",
        event("https://nisd2.eu/compliance", "https://nisd2.eu/invite/5f0c"),
      ),
    ).toEqual(event("https://nisd2.eu/compliance", ""));
  });

  test("drops anything it cannot read", () => {
    expect(analyticsBeforeSend("event", null)).toBeNull();
    expect(analyticsBeforeSend("event", "https://nisd2.eu/journey")).toBeNull();
    expect(analyticsBeforeSend("event", { website: "site" })).toBeNull();
    expect(analyticsBeforeSend("event", event("http://["))).toBeNull();
  });
});
