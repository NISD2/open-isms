import { describe, expect, test } from "bun:test";
import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import { z } from "zod";
import { FUNCTIONAL_GROUPS } from "@/lib/asset-inventory/catalog";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
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
import { NIS2_SCRIPT, NOT_WALKED } from "./nis2";
import type { AnyScreen, ScreenKind } from "./types";

const FRAMEWORK = new Map(
  nis2Categories.flatMap((c) =>
    getNis2RequirementsForCategory(c.slug).map((r) => [
      r.code,
      { category: c.code, moduleRef: r.moduleRef ?? null },
    ]),
  ),
);

/** Whether a screen stands in for the register the requirement page shows. */
const coversModule = (screen: AnyScreen, moduleRef: string): boolean =>
  moduleRef === "asset"
    ? screen.kind === "assets"
    : screen.kind === "register" && screen.module === moduleRef;

/** The screen that stands in for a custom editor the requirement page shows. */
const EDITOR_SCREEN: Readonly<Record<string, ScreenKind>> = { "RSK:2.1": "adopt" };

/** Registers the flow deliberately leaves out, each with the reason. */
const NO_SCREEN: Readonly<Record<string, string>> = {
  "12.2:bsi_registration":
    "the register has no loader or router, so the page always shows 0 entries (spec §0.6); the flow records 12.2 through its fields and its evidence",
  "3.3:incident":
    "the incident register fills when an incident happens; 3.3 prepares the reporting, and the register stays on the incidents page",
  "3.1:policy":
    "the policy form has no upload and asks for type and status as free text; the screen asks for the plan itself, so 3.1 takes it as evidence on the item",
};

/** The value's own schema under any optional, nullable or default wrapper. */
const unwrap = (schema: z.ZodType): z.ZodType =>
  schema instanceof z.ZodOptional ||
  schema instanceof z.ZodNullable ||
  schema instanceof z.ZodDefault
    ? unwrap(schema.unwrap() as z.ZodType)
    : schema;

const screensOf = (item: (typeof NIS2_SCRIPT)[number]): readonly AnyScreen[] =>
  item.screens;

const LOCALES = [
  ["de", de.durchgang, infoDe.info.glossary.terms],
  ["en", en.durchgang, infoEn.info.glossary.terms],
] as const;

describe("the NIS 2 script", () => {
  test("scripts each item once, as a requirement of its declared category", () => {
    const codes = NIS2_SCRIPT.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const item of NIS2_SCRIPT) {
      expect(FRAMEWORK.get(item.code)?.category).toBe(item.category);
    }
  });

  test("walks the start of the journey without a gap, in journey order", () => {
    // Items are scripted from the front of the journey (spec §0.7), so the walk is always the
    // first N codes: a later item scripted before an earlier one would leave a hole in the path.
    // The only holes are the items left out on purpose, each with its reason.
    const front = JOURNEY_ORDER.slice(
      0,
      NIS2_SCRIPT.length + Object.keys(NOT_WALKED).length,
    );
    expect(WALK.map((i) => i.code)).toEqual(front.filter((code) => !NOT_WALKED[code]));
    for (const code of Object.keys(NOT_WALKED)) expect(front).toContain(code);
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

  test("places every intake field of the item exactly once, and no other", () => {
    for (const item of NIS2_SCRIPT) {
      const onScreens = screensOf(item).flatMap((s): readonly string[] => {
        switch (s.kind) {
          case "fields":
            return s.fields;
          case "evidence":
            return s.field ? [s.field] : [];
          default:
            return [];
        }
      });
      const placed = [...onScreens, ...Object.keys(item.notAsked ?? {})];
      const mapped = REQUIREMENT_FIELD_MAP[item.code]?.fieldKeys ?? [];
      expect({ code: item.code, placed: [...placed].sort() }).toEqual({
        code: item.code,
        placed: [...mapped].sort(),
      });
    }
  });

  test("gives every field it does not ask a reason", () => {
    for (const item of NIS2_SCRIPT) {
      for (const reason of Object.values(item.notAsked ?? {})) {
        expect(typeof reason === "string" && reason.trim().length > 20).toBe(true);
      }
    }
  });

  test("gives every register and editor of the requirement page a screen", () => {
    for (const item of NIS2_SCRIPT) {
      const kinds = new Set(screensOf(item).map((s) => s.kind));
      const moduleRef = FRAMEWORK.get(item.code)?.moduleRef;
      if (moduleRef && !NO_SCREEN[`${item.code}:${moduleRef}`]) {
        expect({
          code: item.code,
          moduleRef,
          screen: screensOf(item).some((s) => coversModule(s, moduleRef)),
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
  test("names the authority once per language, filled in wherever the copy says {authority}", () => {
    const registration = NIS2_SCRIPT.find((i) => i.code === "12.2");
    if (!registration) throw new Error("12.2 is scripted");
    const headline = (namespace: unknown) => {
      const resolved = resolveItem(namespace, registration);
      return resolved.ok ? resolved.value.headline : resolved.errors.join("; ");
    };
    expect(headline(de.durchgang)).toBe("Beim BSI registrieren");
    expect(headline(en.durchgang)).toBe("Register with your authority");

    const unknown = structuredClone(en.durchgang);
    unknown.items["12_2"].headline = "Register with {agency}";
    expect(headline(unknown)).toContain("unknown placeholder");
  });

  for (const [locale, namespace, glossary] of LOCALES) {
    test(`every item reads completely in ${locale}, with nothing left over`, () => {
      const errors = NIS2_SCRIPT.flatMap((item) => {
        const resolved = resolveItem(namespace, item);
        return resolved.ok ? [] : resolved.errors;
      });
      expect(errors).toEqual([]);
    });

    test(`every choice field names each of its options in ${locale}, and no other field has options`, () => {
      for (const item of NIS2_SCRIPT) {
        const resolved = resolveItem(namespace, item);
        if (!resolved.ok) continue;
        const shape = CATEGORY_SCHEMAS[item.category]?.shape ?? {};
        for (const { copy } of resolved.value.screens) {
          if (!("fields" in copy)) continue;
          for (const field of copy.fields) {
            const schema = shape[field.key];
            const choice = schema ? unwrap(schema) : null;
            expect({
              code: item.code,
              field: field.key,
              options: field.options ? Object.keys(field.options).sort() : null,
            }).toEqual({
              code: item.code,
              field: field.key,
              options: choice instanceof z.ZodEnum ? [...choice.options].sort() : null,
            });
          }
        }
      }
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
