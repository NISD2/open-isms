/**
 * A threat without a Czech name would fall back to English on a Czech page without anyone
 * noticing, since the lookup never fails. These tests are what notices.
 */
import { describe, expect, test } from "bun:test";
import { THREAT_CATEGORIES, threatCategoryLabel, threatLabel } from "./bsi-threat-labels";
import { BSI_ELEMENTARY_THREATS, BSI_THREAT_CATEGORIES } from "./bsi-threats";

describe("threat names on a Czech page", () => {
  test("every elementary threat has its own Czech name", () => {
    const untranslated = BSI_ELEMENTARY_THREATS.filter(
      (threat) => threatLabel(threat, "cs") === threat.labelEn,
    ).map((threat) => threat.code);
    expect(untranslated).toEqual([]);
  });

  test("every category has a Czech name, in the catalogue's order", () => {
    expect(THREAT_CATEGORIES).toEqual(Object.keys(BSI_THREAT_CATEGORIES));
    for (const category of THREAT_CATEGORIES) {
      expect(threatCategoryLabel(category, "cs")).not.toBe(
        BSI_THREAT_CATEGORIES[category].labelEn,
      );
    }
  });

  test("German and English pages keep their names", () => {
    const [fire] = BSI_ELEMENTARY_THREATS;
    expect(fire && threatLabel(fire, "de")).toBe("Feuer");
    expect(fire && threatLabel(fire, "fr")).toBe("Fire");
  });
});
