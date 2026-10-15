import { describe, expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";
import { SIGNUP_CAMPAIGN_KEYS } from "@/schema";
import {
  analyticsBeforeSend,
  FROM_PATH_KEY,
  isTokenRoute,
  originPath,
  signupTags,
  TOKEN_ROUTE_PREFIXES,
} from "./token-routes";

describe("originPath", () => {
  test("accepts a plain local page path, in any locale", () => {
    for (const path of [
      "/",
      "/en",
      "/en/wiki/timelines-and-status/nis2-timeline",
      "/de/preise",
    ]) {
      expect(originPath(path)).toBe(path);
    }
  });

  test("rejects anything that is not one, and every token route", () => {
    for (const value of [
      "",
      "en/wiki",
      "https://nisd2.eu/en",
      "//nisd2.eu/en",
      "/en?utm_source=x",
      "/en#top",
      "/a b",
      "/invite/5f0c",
      "/fr/supplier-access/5f0c",
      "/".padEnd(101, "x"),
      null,
      42,
    ]) {
      expect(originPath(value)).toBeNull();
    }
  });
});

describe("signupTags", () => {
  test("keeps campaign tags and the origin path, drops the rest of the query", () => {
    const tags = signupTags(
      "mode=register&utm_source=google&from_path=%2Fen%2Fpricing&callbackUrl=%2Finvite%2F5f0c",
    );
    expect(tags.toString()).toBe("utm_source=google&from_path=%2Fen%2Fpricing");
  });

  test("drops an origin that is a token route", () => {
    expect(signupTags("from_path=%2Finvite%2F5f0c").toString()).toBe("");
  });

  test("uses the key the schema stores", () => {
    expect(SIGNUP_CAMPAIGN_KEYS).toContain(FROM_PATH_KEY);
  });
});

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
    expect(analyticsBeforeSend("event", payload)).toEqual(payload);
  });

  test("keeps only campaign tags from the query string, in the form it came in", () => {
    const payload = event(
      "/de/journey?utm_source=digest&utm_campaign=weekly&callbackUrl=/invite/5f0c",
      "https://nisd2.eu/auth/signin?callbackUrl=%2Finvite%2F5f0c",
    );
    expect(analyticsBeforeSend("event", payload)).toEqual({
      ...payload,
      url: "/de/journey?utm_source=digest&utm_campaign=weekly",
      referrer: "https://nisd2.eu/auth/signin",
    });
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
