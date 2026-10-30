import { describe, expect, test } from "bun:test";
import {
  assetHostingEnum,
  assetMfaMethodEnum,
  OUTAGE_SPANS,
} from "@nisd2/grc-data-model/enums";
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import { HOSTINGS, MFA_METHODS, WALK_LOCALES } from "./types";

describe("the walk's lists mirror the database", () => {
  test("the one record of span words names every value asset.max_outage takes, in every language", () => {
    for (const locale of WALK_LOCALES) {
      const spans: Record<string, string> = DURCHGANG_MESSAGES[locale].durchgang.ui.spans;
      expect({ locale, spans: Object.keys(spans).sort() }).toEqual({
        locale,
        spans: [...OUTAGE_SPANS].sort(),
      });
      for (const word of Object.values(spans))
        expect(word.trim().length).toBeGreaterThan(0);
    }
  });

  test("the sign-in methods are exactly the values asset.mfa_method accepts", () => {
    expect([...MFA_METHODS].sort()).toEqual([...assetMfaMethodEnum.enumValues].sort());
  });

  test("where an asset runs is exactly the values asset.hosting accepts", () => {
    expect([...HOSTINGS].sort()).toEqual([...assetHostingEnum.enumValues].sort());
  });
});
