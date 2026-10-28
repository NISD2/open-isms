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
  withCampaignTags,
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

  describe("a sign-in that came by redirect", () => {
    test("records the page the redirect was for when no link handed one on", () => {
      // What the proxy builds when "Start the course" opens a lesson without a session.
      const tags = signupTags("callbackUrl=%2Ftraining%2Fcourses%2Fnis2-ceo%2F0.1");
      expect(tags.toString()).toBe("from_path=%2Ftraining%2Fcourses%2Fnis2-ceo%2F0.1");
    });

    test("the page whose link was clicked wins over the redirect target", () => {
      const tags = signupTags(
        "from_path=%2Fen%2Ftraining%2Fnis2-ceo&callbackUrl=%2Fen%2Ftraining%2Fcourses%2Fnis2-ceo%2F0.1",
      );
      expect(tags.get(FROM_PATH_KEY)).toBe("/en/training/nis2-ceo");
    });

    test("falls back when the handed-on path is not usable", () => {
      const tags = signupTags("from_path=%2Finvite%2F5f0c&callbackUrl=%2Fbestellen");
      expect(tags.get(FROM_PATH_KEY)).toBe("/bestellen");
    });

    test("drops the query and fragment of the target, keeps the campaign tags", () => {
      const tags = signupTags(
        "utm_source=linkedin&callbackUrl=%2Ftraining%2Fcourses%3Ftoken%3Dabc%23x",
      );
      expect(tags.toString()).toBe("utm_source=linkedin&from_path=%2Ftraining%2Fcourses");
    });

    test("never records a credential link or an address off this site", () => {
      for (const target of [
        "/invite/5f0c",
        "/en/supplier-access/5f0c",
        "/auth/setup?token=abc",
        "//evil.example/x",
        "/\\evil.example/x",
        "https://evil.example/x",
        "javascript:alert(1)",
        "training",
        "",
      ]) {
        const tags = signupTags(`callbackUrl=${encodeURIComponent(target)}`);
        expect(tags.has(FROM_PATH_KEY)).toBe(false);
      }
    });

    test("records nothing for a plain visit", () => {
      expect(signupTags("mode=register").toString()).toBe("");
    });
  });
});

describe("withCampaignTags", () => {
  const signin = () => new URL("https://nisd2.eu/auth/signin?callbackUrl=%2Ftraining");

  test("carries the campaign tags of the request over to the redirect target", () => {
    const target = withCampaignTags(
      signin(),
      "?utm_source=linkedin&utm_medium=social&x=1",
    );
    expect(target.searchParams.get("utm_source")).toBe("linkedin");
    expect(target.searchParams.get("utm_medium")).toBe("social");
    expect(target.searchParams.get("callbackUrl")).toBe("/training");
  });

  test("leaves every other key of the request behind", () => {
    const target = withCampaignTags(signin(), "?token=abc&email=a%40b.de");
    expect([...target.searchParams.keys()]).toEqual(["callbackUrl"]);
  });

  test("does not overwrite a key the target already has, and does not touch its input", () => {
    const input = new URL("https://nisd2.eu/start?utm_source=ad");
    const target = withCampaignTags(input, "?utm_source=other&utm_term=nis2");
    expect(target.searchParams.get("utm_source")).toBe("ad");
    expect(target.searchParams.get("utm_term")).toBe("nis2");
    expect(input.search).toBe("?utm_source=ad");
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
      "/partner-agreement/5f0c",
      "/de/partner-agreement/5f0c",
      "/mcp/verbinden/eyJhbGciOi",
      "/en/mcp/verbinden/eyJhbGciOi",
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

  test("drops a view of the assistant connect page, which carries a signed request", () => {
    expect(
      analyticsBeforeSend("event", event("https://nisd2.eu/mcp/verbinden/eyJhbGciOi")),
    ).toBeNull();
    expect(
      analyticsBeforeSend(
        "event",
        event("https://nisd2.eu/compliance", "https://nisd2.eu/mcp/verbinden/eyJhbGciOi"),
      ),
    ).toEqual(event("https://nisd2.eu/compliance", ""));
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
