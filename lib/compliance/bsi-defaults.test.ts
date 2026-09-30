import { describe, expect, test } from "bun:test";
import { PLATFORM_DEFAULTS } from "./platform-defaults";
import { getDefaultPolicyConfig } from "./policy-config-defaults";
import { getDefaultMethodology } from "./risk-methodology-defaults";

/**
 * The defaults that repeat a BSI statement, pinned to that statement, so a later edit cannot drift
 * away from the source without failing here. Each expectation names where the BSI says it.
 */
describe("BSI defaults", () => {
  test("risk scales use the BSI-Standard 200-3 labels (Tabellen 8 and 9)", () => {
    const de = getDefaultMethodology("de");
    expect(de.likelihoodLevels.map((l) => l.label)).toEqual([
      "Selten",
      "Mittel",
      "Häufig",
      "Sehr häufig",
    ]);
    expect(de.impactLevels.map((l) => l.label)).toEqual([
      "Vernachlässigbar",
      "Begrenzt",
      "Beträchtlich",
      "Existenzbedrohend",
    ]);
    expect(de.likelihoodLevels[2]?.description).toBe(
      "Ereignis tritt einmal im Jahr bis einmal pro Monat ein.",
    );
  });

  test("the English scales mirror the German ones level for level", () => {
    const de = getDefaultMethodology("de");
    const en = getDefaultMethodology("en");
    expect(en.likelihoodLevels.map((l) => l.value)).toEqual(
      de.likelihoodLevels.map((l) => l.value),
    );
    expect(en.impactLevels.map((l) => l.value)).toEqual(
      de.impactLevels.map((l) => l.value),
    );
  });

  test("the crypto concept is reviewed yearly (CON.1.A15)", () => {
    expect(getDefaultPolicyConfig("crypto").reviewCycleYears).toBe(1);
  });

  test("policy documents are reviewed yearly (BSI-Standard 200-2)", () => {
    expect(getDefaultPolicyConfig("secure_dev").reviewCycleYears).toBe(1);
    expect(getDefaultPolicyConfig("patch_mgmt").reviewCycleYears).toBe(1);
  });

  test("access reviews: yearly, quarterly for privileged accounts (Grundschutz++ BER.4.4)", () => {
    expect(getDefaultPolicyConfig("access_control", "en").reviewFrequency).toEqual({
      standard: "annual",
      privileged: "quarterly",
    });
  });

  test("passwords default to 14 characters (Grundschutz++ BER.6.4)", () => {
    expect(PLATFORM_DEFAULTS["11.3"]?.passwordMinLength).toBe(14);
  });
});
