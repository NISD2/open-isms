import { describe, expect, test } from "bun:test";
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import { ACTIVITY_GROUPS, GDPR_WALK } from "@/lib/durchgang";
import { ACTIVITY_CATALOG } from "./catalog";
import { activityCopyOf } from "./copy";

describe("the processing-activity catalogue", () => {
  test("ids are unique, and every group a screen offers has activities", () => {
    const ids = ACTIVITY_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of ACTIVITY_GROUPS) {
      expect(ACTIVITY_CATALOG.some((a) => a.group === group)).toBe(true);
    }
  });

  test("the walk offers every group once", () => {
    const offered = GDPR_WALK.items.flatMap((item) =>
      item.screens.flatMap((s) => (s.kind === "activities" ? s.groups : [])),
    );
    expect([...offered].sort()).toEqual([...ACTIVITY_GROUPS].sort());
  });

  for (const locale of GDPR_WALK.locales) {
    test(`names every activity and suggests its answers in ${locale}`, () => {
      const { copy, errors } = activityCopyOf(DURCHGANG_MESSAGES[locale].durchgang);
      expect(errors).toEqual([]);
      expect(copy.size).toBe(ACTIVITY_CATALOG.length);
    });
  }

  test("each activity's name differs per language only, never between activities", () => {
    for (const locale of GDPR_WALK.locales) {
      const { copy } = activityCopyOf(DURCHGANG_MESSAGES[locale].durchgang);
      const names = [...copy.values()].map((c) => c.label.toLowerCase());
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
