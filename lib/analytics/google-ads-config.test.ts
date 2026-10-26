import { describe, expect, test } from "bun:test";
import { googleAdsConfig } from "./google-ads-config";

describe("googleAdsConfig", () => {
  test("both settings, shaped like Google's, give the config", () => {
    expect(
      googleAdsConfig({
        GOOGLE_ADS_TAG_ID: "AW-1234567890",
        GOOGLE_ADS_CONVERSION_LABEL: "aB3_-xYz",
      }),
    ).toEqual({ tagId: "AW-1234567890", conversionLabel: "aB3_-xYz" });
  });

  test("a copied-over self-hosted environment has neither, so no tag", () => {
    expect(googleAdsConfig({})).toBeNull();
    expect(googleAdsConfig({ GOOGLE_ADS_TAG_ID: "AW-1234567890" })).toBeNull();
    expect(googleAdsConfig({ GOOGLE_ADS_CONVERSION_LABEL: "aB3" })).toBeNull();
  });

  test("a wrong shape switches it off instead of reaching the page", () => {
    for (const tagId of ["G-ABC123", "AW-", "AW-12x", "1234567890", "AW-1 2"]) {
      expect(
        googleAdsConfig({ GOOGLE_ADS_TAG_ID: tagId, GOOGLE_ADS_CONVERSION_LABEL: "aB3" }),
      ).toBeNull();
    }
    for (const label of ["a b", "a/b", "a'b", `a"b`, "<x>", "x".repeat(65)]) {
      expect(
        googleAdsConfig({
          GOOGLE_ADS_TAG_ID: "AW-1234567890",
          GOOGLE_ADS_CONVERSION_LABEL: label,
        }),
      ).toBeNull();
    }
  });
});
