/**
 * L0 drift tests (bun test, no browser, seconds). Fails the PR that lets
 * the intake schemas and the test data drift apart:
 *
 *  1. The value factory must produce a parse-clean value set for EVERY
 *     current category schema (a new field the factory cannot satisfy
 *     fails here).
 *  2. Every Stadtwerk persona field must still exist in its schema
 *     (a renamed or removed field fails here).
 *  3. Factory defaults + persona overrides must parse together (a
 *     retyped field or tightened constraint fails here).
 */
import { describe, test, expect } from "bun:test";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { generateFormValues } from "../lib/value-factory";
import { STADTWERK_INTAKE } from "../personas/stadtwerk-musterstadt";

const categories = Object.keys(CATEGORY_SCHEMAS);

/** Persona fields grouped per category via the product's own mapping. */
function personaFieldsForCategory(cat: string): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const [code, fields] of Object.entries(STADTWERK_INTAKE)) {
    if (REQUIREMENT_FIELD_MAP[code]?.categoryCode !== cat) continue;
    Object.assign(merged, fields);
  }
  return merged;
}

describe("value factory satisfies every category schema", () => {
  for (const cat of categories) {
    test(cat, () => {
      const schema = CATEGORY_SCHEMAS[cat];
      const result = schema.safeParse(generateFormValues(schema));
      expect(
        result.success,
        result.success ? "" : JSON.stringify(result.error.issues, null, 2),
      ).toBe(true);
    });
  }
});

describe("persona keys exist in their schemas", () => {
  for (const [code, fields] of Object.entries(STADTWERK_INTAKE)) {
    test(`requirement ${code}`, () => {
      const info = REQUIREMENT_FIELD_MAP[code];
      expect(info, `persona has code ${code} but the product maps no intake fields to it`).toBeDefined();
      const shape = CATEGORY_SCHEMAS[info.categoryCode].shape;
      for (const key of Object.keys(fields)) {
        expect(
          key in shape,
          `persona field "${key}" (req ${code}) not in ${info.categoryCode} schema`,
        ).toBe(true);
      }
    });
  }
});

describe("factory defaults + persona overrides parse together", () => {
  for (const cat of categories) {
    test(cat, () => {
      const schema = CATEGORY_SCHEMAS[cat];
      const values = generateFormValues(schema, personaFieldsForCategory(cat));
      const result = schema.safeParse(values);
      expect(
        result.success,
        result.success ? "" : JSON.stringify(result.error.issues, null, 2),
      ).toBe(true);
    });
  }
});
