import { describe, expect, test } from "bun:test";
import { FRAMEWORK_DATA } from "@nisd2/grc-data-model/frameworks";
import { z } from "zod";
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { POLICY_TYPES } from "@/lib/compliance/policy-config-defaults";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { getTermEntry } from "@/lib/dictionary/glossary";
import { marker } from "./copy";
import { approvalOf, askedFields, resolveItem, WAIT_REASONS, WALKS } from "./index";
import type { AnyItem, AnyScreen, Walk } from "./types";

/**
 * What every walk's script and words must hold, run over each walk. A walk's own rules (NIS 2's
 * duty card on the BSIG, its journey order) stay in its own test file.
 */

/** The value's own schema under any optional, nullable or default wrapper. */
const unwrap = (schema: z.ZodType): z.ZodType =>
  schema instanceof z.ZodOptional ||
  schema instanceof z.ZodNullable ||
  schema instanceof z.ZodDefault
    ? unwrap(schema.unwrap() as z.ZodType)
    : schema;

const screensOf = (item: AnyItem): readonly AnyScreen[] => item.screens;

/** The framework's requirements as the package seeds them, by code. */
const requirementsOf = (walk: Walk) => {
  const data = FRAMEWORK_DATA.find((f) => f.code === walk.framework);
  if (!data) throw new Error(`${walk.framework} has no framework data`);
  return new Map(
    data.categories.flatMap((c) =>
      data.getRequirements(c.slug).map((r) => [
        r.code,
        {
          category: c.code,
          moduleRef: r.moduleRef ?? null,
          frameworkRef: r.frameworkRef,
        },
      ]),
    ),
  );
};

/** Whether a screen stands in for the register the requirement page shows. */
const coversModule = (screen: AnyScreen, moduleRef: string): boolean => {
  switch (moduleRef) {
    case "asset":
      return screen.kind === "assets";
    case "risk":
      return screen.kind === "rate";
    case "policy":
      return screen.kind === "policy";
    case "supplier":
      return (
        (screen.kind === "register" && screen.module === "supplier") ||
        screen.kind === "agreements"
      );
    default:
      return screen.kind === "register" && screen.module === moduleRef;
  }
};

/** Registers a walk deliberately leaves to their own page, each with the reason. */
const NO_SCREEN: Readonly<Record<string, string>> = {
  "12.2:bsi_registration":
    "the register has no loader or router, so the page always shows 0 entries (spec §0.6); the flow records 12.2 through its fields and its evidence",
  "3.3:incident":
    "the incident register fills when an incident happens; 3.3 prepares the reporting, and the register stays on the incidents page",
  "6.3:vulnerability":
    "the vulnerability register fills when a vulnerability is found; 6.3 writes the rules for handling one, and the register stays on the vulnerabilities page",
  "4.4:asset":
    "backup details per system (frequency, location, last test) stay on the requirement page; the walk records the company's backup rhythm and the date of its last working restore",
};

for (const walk of Object.values(WALKS)) {
  const requirements = requirementsOf(walk);
  const locales = walk.locales.map(
    (locale) => [locale, DURCHGANG_MESSAGES[locale].durchgang] as const,
  );

  describe(`the ${walk.framework} script`, () => {
    test("scripts each item once, as a requirement of its declared category", () => {
      const codes = walk.items.map((i) => i.code);
      expect(new Set(codes).size).toBe(codes.length);
      for (const item of walk.items) {
        expect({
          code: item.code,
          category: requirements.get(item.code)?.category,
        }).toEqual({ code: item.code, category: item.category });
      }
    });

    test("walks every requirement of its framework, or says why not", () => {
      const walked = new Set(walk.items.map((i) => i.code));
      for (const code of requirements.keys()) {
        if (walked.has(code)) continue;
        expect({ code, reason: (walk.notWalked[code]?.trim().length ?? 0) > 20 }).toEqual(
          {
            code,
            reason: true,
          },
        );
      }
      for (const code of Object.keys(walk.notWalked)) {
        expect({ code, known: requirements.has(code) }).toEqual({ code, known: true });
      }
    });

    test("opens the duty card at an article the requirement cites", () => {
      for (const item of walk.items) {
        if (item.law.act !== walk.framework) throw new Error(`${item.code}: wrong act`);
        if (item.law.article === null) continue;
        expect({
          code: item.code,
          cites: requirements
            .get(item.code)
            ?.frameworkRef?.includes(`Art. ${item.law.article}`),
        }).toEqual({ code: item.code, cites: true });
      }
    });

    test("ends with its one approval, in its last item", () => {
      const approval = approvalOf(walk);
      expect(approval?.code).toBe(walk.items.at(-1)?.code);
      const approving = walk.items.filter((i) =>
        i.screens.some((s) => s.kind === "approve"),
      );
      expect(approving).toHaveLength(1);
    });

    test("opens every item with what it is and closes with what was recorded", () => {
      for (const item of walk.items) {
        const screens = screensOf(item);
        expect(screens[0]?.kind).toBe("learn");
        expect(screens.at(-1)?.kind).toBe("done");
        expect(screens.filter((s) => s.kind === "done")).toHaveLength(1);
        const ids = screens.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    test("writes at most one policy per item, never under a type an editor keeps its settings in", () => {
      // The server approves the policy of the item's policy screen, and the walk stores its clause
      // choice in company_policy_config under the template's name, which would replace an
      // editor's settings of the same type.
      for (const item of walk.items) {
        const policies = screensOf(item).flatMap((s) =>
          s.kind === "policy" ? [s.policy] : [],
        );
        expect({ code: item.code, policies: policies.length <= 1 }).toEqual({
          code: item.code,
          policies: true,
        });
        for (const policy of policies) {
          expect(POLICY_TYPES as readonly string[]).not.toContain(policy);
        }
      }
    });

    test("places every intake field of the item exactly once, and no other", () => {
      for (const item of walk.items) {
        const placed = [...askedFields(item), ...Object.keys(item.notAsked ?? {})];
        const mapped = REQUIREMENT_FIELD_MAP[item.code]?.fieldKeys ?? [];
        expect({ code: item.code, placed: [...placed].sort() }).toEqual({
          code: item.code,
          placed: [...mapped].sort(),
        });
      }
    });

    test("starts on today only a date field the same screen asks", () => {
      for (const item of walk.items) {
        for (const screen of screensOf(item)) {
          if (screen.kind !== "fields") continue;
          for (const key of screen.today ?? []) {
            expect(screen.fields).toContain(key);
            const shape = CATEGORY_SCHEMAS[item.category].shape as Record<
              string,
              z.ZodType
            >;
            expect({ key, date: shape[key] instanceof z.ZodDate }).toEqual({
              key,
              date: true,
            });
          }
        }
      }
    });

    test("gives every field it does not ask a reason", () => {
      for (const item of walk.items) {
        for (const reason of Object.values(item.notAsked ?? {})) {
          expect(typeof reason === "string" && reason.trim().length > 20).toBe(true);
        }
      }
    });

    test("gives every register of the requirement page a screen", () => {
      for (const item of walk.items) {
        const moduleRef = requirements.get(item.code)?.moduleRef;
        if (!moduleRef || NO_SCREEN[`${item.code}:${moduleRef}`]) continue;
        expect({
          code: item.code,
          moduleRef,
          screen: screensOf(item).some((s) => coversModule(s, moduleRef)),
        }).toEqual({ code: item.code, moduleRef, screen: true });
      }
    });

    test("dates every item's fact-check on a real day that has passed", () => {
      // The check is dated in Berlin, where the fact-check document is written.
      const today = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Berlin",
      }).format(new Date());
      for (const item of walk.items) {
        const day = new Date(`${item.reviewed}T00:00:00Z`);
        expect(day.toISOString().slice(0, 10)).toBe(item.reviewed);
        expect(item.reviewed <= today).toBe(true);
      }
    });
  });

  describe(`the words of the ${walk.framework} walk`, () => {
    test("tags every kind of screen the walk shows, in each of its languages", () => {
      const shown = [
        ...new Set(walk.items.flatMap((item) => item.screens.map((s) => s.kind))),
      ];
      for (const [, namespace] of locales) {
        const tagged: Readonly<Record<string, string>> = namespace.ui.kinds;
        expect(shown.filter((kind) => !tagged[kind]?.trim())).toEqual([]);
      }
    });

    test("names the company and the answers only inside a policy, where the text is written with them", () => {
      for (const [, namespace] of locales) {
        for (const item of walk.items) {
          const resolved = resolveItem(namespace, item);
          if (!resolved.ok) continue;
          const outside = resolved.value.screens.map((s) =>
            s.kind === "policy" ? { ...s.copy, document: null } : s.copy,
          );
          const head = [
            resolved.value.headline,
            resolved.value.teaser,
            resolved.value.missed,
          ];
          const text = JSON.stringify([head, outside]);
          for (const name of ["company", ...askedFields(item)]) {
            expect(text).not.toContain(marker(name));
          }
        }
      }
    });

    test("a policy names only text answers, which read the same on the screen and in the record", () => {
      // A date or a number is held as input text on the screen and as JSON in the record, so the
      // two would print it differently.
      for (const [, namespace] of locales) {
        for (const item of walk.items) {
          const resolved = resolveItem(namespace, item);
          if (!resolved.ok) continue;
          const shape = CATEGORY_SCHEMAS[item.category]?.shape ?? {};
          const documents = JSON.stringify(
            resolved.value.screens.flatMap((s) =>
              s.kind === "policy" ? [s.copy.document] : [],
            ),
          );
          for (const field of askedFields(item)) {
            const schema = shape[field];
            if (schema && unwrap(schema) instanceof z.ZodString) continue;
            expect({ field, named: documents.includes(marker(field)) }).toEqual({
              field,
              named: false,
            });
          }
        }
      }
    });

    test("a policy offers the same clauses in every language, in the same order", () => {
      // A clause is stored by its id in the record language and offered by that id in the
      // reader's, so the two lists may not drift apart.
      const clausesIn = (namespace: unknown, item: AnyItem) => {
        const resolved = resolveItem(namespace, item);
        return resolved.ok
          ? resolved.value.screens.flatMap((s) =>
              s.kind === "policy" ? [s.copy.document.clauses.map((c) => c.id)] : [],
            )
          : [];
      };
      const [first, ...others] = locales;
      if (!first) throw new Error(`${walk.framework} is written in no language`);
      for (const item of walk.items) {
        for (const [locale, other] of others) {
          expect({ code: item.code, locale, clauses: clausesIn(first[1], item) }).toEqual(
            {
              code: item.code,
              locale,
              clauses: clausesIn(other, item),
            },
          );
        }
      }
    });

    for (const [locale, namespace] of locales) {
      test(`every item reads completely in ${locale}, with nothing left over`, () => {
        const errors = walk.items.flatMap((item) => {
          const resolved = resolveItem(namespace, item);
          return resolved.ok ? [] : resolved.errors;
        });
        expect(errors).toEqual([]);
      });

      test(`every choice field names each of its options in ${locale}, and no other field has options`, () => {
        for (const item of walk.items) {
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

      test(`names the walk and its home in ${locale}`, () => {
        const own = namespace.walks[walk.framework];
        expect(own.title.trim()).not.toBe("");
        expect(own.intro.points.length).toBeGreaterThan(0);
      });

      test(`every glossary term an item links exists in ${locale}`, () => {
        for (const item of walk.items) {
          for (const term of item.glossary) {
            expect({ term, found: getTermEntry(term, locale) !== undefined }).toEqual({
              term,
              found: true,
            });
          }
        }
      });
    }
  });
}
