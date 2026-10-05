import { describe, expect, test } from "bun:test";
import { describeSignupCampaign, signupCampaignFrom } from "./signup-campaign";

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
});
