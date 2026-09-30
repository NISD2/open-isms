import { describe, expect, test } from "bun:test";
import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import { FUNCTIONAL_GROUPS } from "@/lib/asset-inventory/catalog";
import { JOURNEY_ORDER } from "@/lib/compliance/journey-position";
import {
  CUSTOM_EDITOR_KEYS,
  REQUIREMENT_FIELD_MAP,
} from "@/lib/compliance/requirement-fields";
import de from "@/messages/durchgang/de.json";
import en from "@/messages/durchgang/en.json";
import infoDe from "@/messages/info/de.json";
import infoEn from "@/messages/info/en.json";
import { resolveItem, WAIT_REASONS, WALK } from "./index";
import { NIS2_SCRIPT } from "./nis2";
import type { AnyScreen, ScreenKind } from "./types";

/** v1 walks the first ten items of the journey (spec §0.7). */
const V1 = JOURNEY_ORDER.slice(0, 10);

const FRAMEWORK = new Map(
  nis2Categories.flatMap((c) =>
    getNis2RequirementsForCategory(c.slug).map((r) => [
      r.code,
      { category: c.code, moduleRef: r.moduleRef ?? null },
    ]),
  ),
);

/** The screen that stands in for a register the requirement page shows. */
const MODULE_SCREEN: Readonly<Record<string, ScreenKind>> = { asset: "assets" };

/** The screen that stands in for a custom editor the requirement page shows. */
const EDITOR_SCREEN: Readonly<Record<string, ScreenKind>> = { "RSK:2.1": "adopt" };

/** Registers the flow deliberately leaves out, each with the reason. */
const NO_SCREEN: Readonly<Record<string, string>> = {
  "12.2:bsi_registration":
    "the register has no loader or router, so the page always shows 0 entries (spec §0.6); the flow records 12.2 through its fields and its evidence",
};

const screensOf = (item: (typeof NIS2_SCRIPT)[number]): readonly AnyScreen[] =>
  item.screens;

const LOCALES = [
  ["de", de.durchgang, infoDe.info.glossary.terms],
  ["en", en.durchgang, infoEn.info.glossary.terms],
] as const;

describe("the NIS 2 script", () => {
  test("scripts each item once, and only v1 requirements of their declared category", () => {
    const codes = NIS2_SCRIPT.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const item of NIS2_SCRIPT) {
      expect(FRAMEWORK.get(item.code)?.category).toBe(item.category);
      expect(V1).toContain(item.code);
    }
  });

  test("walks the scripted items in journey order", () => {
    expect(WALK.map((i) => i.code)).toEqual(
      JOURNEY_ORDER.filter((code) => NIS2_SCRIPT.some((i) => i.code === code)),
    );
  });

  test("opens every item with what it is and closes with what was recorded", () => {
    for (const item of NIS2_SCRIPT) {
      const screens = screensOf(item);
      expect(screens[0]?.kind).toBe("learn");
      expect(screens.at(-1)?.kind).toBe("done");
      expect(screens.filter((s) => s.kind === "done")).toHaveLength(1);
      const ids = screens.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test("asks every intake field of the item exactly once, and no other", () => {
    for (const item of NIS2_SCRIPT) {
      const asked = screensOf(item).flatMap((s) =>
        s.kind === "fields"
          ? s.fields
          : s.kind === "evidence" && s.field
            ? [s.field]
            : [],
      );
      const mapped = REQUIREMENT_FIELD_MAP[item.code]?.fieldKeys ?? [];
      expect({ code: item.code, asked: [...asked].sort() }).toEqual({
        code: item.code,
        asked: [...mapped].sort(),
      });
    }
  });

  test("gives every register and editor of the requirement page a screen", () => {
    for (const item of NIS2_SCRIPT) {
      const kinds = new Set(screensOf(item).map((s) => s.kind));
      const moduleRef = FRAMEWORK.get(item.code)?.moduleRef;
      if (moduleRef && !NO_SCREEN[`${item.code}:${moduleRef}`]) {
        const needed = MODULE_SCREEN[moduleRef];
        expect({
          code: item.code,
          moduleRef,
          screen: needed && kinds.has(needed),
        }).toEqual({
          code: item.code,
          moduleRef,
          screen: true,
        });
      }
      const editor = `${item.category}:${item.code}`;
      if ((CUSTOM_EDITOR_KEYS as readonly string[]).includes(editor)) {
        const needed = EDITOR_SCREEN[editor];
        expect({ editor, screen: needed && kinds.has(needed) }).toEqual({
          editor,
          screen: true,
        });
      }
    }
  });

  test("offers the whole asset catalogue, each group on one screen", () => {
    for (const item of NIS2_SCRIPT) {
      const groups = screensOf(item).flatMap((s) =>
        s.kind === "assets" ? s.groups : [],
      );
      if (groups.length > 0)
        expect([...groups].sort()).toEqual([...FUNCTIONAL_GROUPS].sort());
    }
  });

  test("dates every item's fact-check on a real day that has passed", () => {
    for (const item of NIS2_SCRIPT) {
      const day = new Date(`${item.reviewed}T00:00:00Z`);
      expect(day.toISOString().slice(0, 10)).toBe(item.reviewed);
      expect(day.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});

describe("the words of the Durchgang", () => {
  for (const [locale, namespace, glossary] of LOCALES) {
    test(`every item reads completely in ${locale}, with nothing left over`, () => {
      const errors = NIS2_SCRIPT.flatMap((item) => {
        const resolved = resolveItem(namespace, item);
        return resolved.ok ? [] : resolved.errors;
      });
      expect(errors).toEqual([]);
    });

    test(`every wait reason has words in ${locale}`, () => {
      for (const reason of WAIT_REASONS) {
        expect(namespace.waitReasons[reason].trim()).not.toBe("");
      }
    });

    test(`every glossary term an item links exists in ${locale}`, () => {
      for (const item of NIS2_SCRIPT) {
        for (const key of item.glossary) expect(Object.hasOwn(glossary, key)).toBe(true);
      }
    });
  }
});
