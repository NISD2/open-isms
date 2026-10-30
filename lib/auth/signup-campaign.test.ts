import { describe, expect, test } from "bun:test";
import {
  describeSignupCampaign,
  describeSignupGate,
  signupCampaignFrom,
} from "./signup-campaign";

describe("signupCampaignFrom", () => {
  test("keeps the five utm tags and drops every other key", () => {
    expect(
      signupCampaignFrom(
        "utm_source=google&utm_medium=cpc&utm_campaign=123&utm_content=a&utm_term=nis2%20software&utm_id=9&callbackUrl=/invite/abc&gclid=x",
      ),
    ).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "123",
      utm_content: "a",
      utm_term: "nis2 software",
    });
  });

  test("drops blank and overlong values, keeps the rest", () => {
    expect(
      signupCampaignFrom(`utm_source=%20%20&utm_term=${"x".repeat(101)}&utm_medium=cpc`),
    ).toEqual({ utm_medium: "cpc" });
  });

  test("trims values", () => {
    expect(signupCampaignFrom("utm_source=%20google%20")).toEqual({
      utm_source: "google",
    });
  });

  test("keeps the page the visitor registered from, next to the tags", () => {
    expect(
      signupCampaignFrom(
        "utm_source=google&from_path=/en/wiki/timelines-and-status/nis2-timeline",
      ),
    ).toEqual({
      utm_source: "google",
      from_path: "/en/wiki/timelines-and-status/nis2-timeline",
    });
    expect(signupCampaignFrom("from_path=/")).toEqual({ from_path: "/" });
  });

  test("drops an origin that is not a plain local path or is a token route", () => {
    for (const from of [
      "https://evil.example/x",
      "//evil.example/x",
      "/wiki?token=abc",
      "/wiki#section",
      "/invite/5f0c",
      "/de/auth/setup",
      "wiki/x",
      `/${"x".repeat(100)}`,
    ]) {
      expect(
        signupCampaignFrom(new URLSearchParams({ from_path: from }).toString()),
      ).toBeNull();
    }
  });

  test("keeps the entry door the visitor was sent away from, apart from the page clicked", () => {
    expect(
      signupCampaignFrom(
        "from_path=/en/training/nis2-ceo&gate_path=/en/training/courses/nis2-ceo/0.1",
      ),
    ).toEqual({
      from_path: "/en/training/nis2-ceo",
      gate_path: "/en/training/courses/nis2-ceo/0.1",
    });
  });

  test("a gate_path that is not an entry door, or is a credential or off site, is dropped", () => {
    for (const gate of [
      "/suppliers/0b3c2f4e-9d7a-4e1b-8c55-6f1a2d3e4b5c",
      "/billing",
      "/invite/5f0c",
      "//evil.example/training",
      "https://nisd2.eu/training/courses",
      "/training/courses?token=abc",
      "training/courses",
    ]) {
      expect(
        signupCampaignFrom(new URLSearchParams({ gate_path: gate }).toString()),
      ).toBeNull();
    }
  });

  test("null when nothing survives or the input is not a short string", () => {
    expect(signupCampaignFrom("")).toBeNull();
    expect(signupCampaignFrom("callbackUrl=/invite/abc")).toBeNull();
    expect(signupCampaignFrom(undefined)).toBeNull();
    expect(signupCampaignFrom({ utm_source: "google" })).toBeNull();
    expect(signupCampaignFrom(`utm_source=google&pad=${"x".repeat(2000)}`)).toBeNull();
  });
});

describe("describeSignupCampaign", () => {
  test("one line in a fixed order", () => {
    expect(
      describeSignupCampaign({
        utm_term: "nis2 software",
        utm_source: "google",
        utm_medium: "cpc",
      }),
    ).toBe("utm_source=google / utm_medium=cpc / utm_term=nis2 software");
  });

  test("null without tags", () => {
    expect(describeSignupCampaign(null)).toBeNull();
    expect(describeSignupCampaign({})).toBeNull();
  });

  test("names the origin page last", () => {
    expect(
      describeSignupCampaign({ from_path: "/en/pricing", utm_source: "google" }),
    ).toBe("utm_source=google / from_path=/en/pricing");
  });

  test("leaves the entry door to its own line", () => {
    const campaign = {
      utm_source: "linkedin",
      gate_path: "/training/courses/nis2-ceo/0.1",
    };
    expect(describeSignupCampaign(campaign)).toBe("utm_source=linkedin");
    expect(describeSignupGate(campaign)).toBe("/training/courses/nis2-ceo/0.1");
    expect(describeSignupCampaign({ gate_path: "/journey" })).toBeNull();
  });
});

describe("describeSignupGate", () => {
  test("null without a gate", () => {
    expect(describeSignupGate(null)).toBeNull();
    expect(describeSignupGate({ utm_source: "google" })).toBeNull();
  });
});
