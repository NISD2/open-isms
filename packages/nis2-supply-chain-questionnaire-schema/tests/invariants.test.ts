import { describe, expect, test } from "bun:test";
import {
  groupBySection,
  isVisible,
  supplierQuestionnaire,
  visibleFields,
} from "../src/data";
import { conditionsOf, FIELD_TYPE } from "../src/schema";

// These tests guard invariants that the Zod schema cannot express:
// uniqueness, cross-references, conditional shape, semantic content,
// and helper-function behaviour. Anything Zod already enforces (regex,
// enum membership, min-length on locales) is intentionally not covered
// here — the parse in src/data.ts would fail first.

describe("data loads", () => {
  test("schema parses and the questionnaire is non-empty", () => {
    expect(supplierQuestionnaire.fields.length).toBeGreaterThan(0);
    expect(supplierQuestionnaire.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("the published JSON Schema describes the questionnaire", async () => {
    const published = await Bun.file(
      new URL("../schema/supply-chain-questionnaire.schema.json", import.meta.url),
    ).json();
    expect(Object.keys(published.properties ?? {})).toEqual([
      "version",
      "lastUpdated",
      "fields",
    ]);
  });
});

describe("uniqueness", () => {
  test("field IDs are unique", () => {
    const ids = supplierQuestionnaire.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("conditional shape", () => {
  test("enum-typed fields have non-empty options; non-enum fields have none", () => {
    for (const field of supplierQuestionnaire.fields) {
      if (field.type === FIELD_TYPE.ENUM) {
        expect(field.options).toBeDefined();
        expect(field.options?.length ?? 0).toBeGreaterThan(0);
      } else {
        expect(field.options).toBeUndefined();
      }
    }
  });
});

describe("cross-references", () => {
  test("every visibleWhen.field resolves to an existing field", () => {
    const ids = new Set(supplierQuestionnaire.fields.map((f) => f.id));
    for (const field of supplierQuestionnaire.fields) {
      for (const condition of conditionsOf(field)) {
        expect(ids.has(condition.field)).toBe(true);
      }
    }
  });

  test("every visibleWhen.equals value matches the referenced field's type", () => {
    const fieldsById = new Map(supplierQuestionnaire.fields.map((f) => [f.id, f]));
    const conditions = supplierQuestionnaire.fields.flatMap(conditionsOf);
    for (const condition of conditions) {
      const target = fieldsById.get(condition.field);
      if (!target) throw new Error("unreachable — guarded by previous test");
      const equals = condition.equals;
      switch (target.type) {
        case FIELD_TYPE.BOOLEAN:
          expect(typeof equals).toBe("boolean");
          break;
        case FIELD_TYPE.INTEGER:
          expect(typeof equals).toBe("number");
          break;
        case FIELD_TYPE.ENUM: {
          expect(typeof equals).toBe("string");
          const allowed = new Set((target.options ?? []).map((o) => o.value));
          expect(allowed.has(equals as string)).toBe(true);
          break;
        }
        default:
          expect(typeof equals).toBe("string");
      }
    }
  });
});

describe("citations", () => {
  test("every field cites an EU-level instrument (NIS2, CIR, ENISA, GDPR, CRA)", () => {
    const allowed = ["NIS2", "CIR", "ENISA", "GDPR", "CRA"];
    for (const field of supplierQuestionnaire.fields) {
      const matched = allowed.some((p) => field.legalBasis.startsWith(p));
      expect(matched).toBe(true);
    }
  });

  test("no field cites a national-derivative instrument (BSI, ANSSI, CCB)", () => {
    const banned = ["BSI", "IT-Grundschutz", "ANSSI", "CCB", "CyFun"];
    for (const field of supplierQuestionnaire.fields) {
      for (const term of banned) {
        expect(field.legalBasis).not.toContain(term);
      }
    }
  });
});

describe("helpers", () => {
  test("groupBySection places every field in exactly one section bucket", () => {
    const grouped = groupBySection(supplierQuestionnaire);
    let total = 0;
    for (const fields of grouped.values()) {
      total += fields.length;
    }
    expect(total).toBe(supplierQuestionnaire.fields.length);
  });

  test("visibleFields hides fields whose condition does not hold", () => {
    const response = { isSaas: true, isOnPrem: false };
    const visible = visibleFields(supplierQuestionnaire, response);
    const visibleIds = new Set(visible.map((f) => f.id));

    expect(visibleIds.has("legalName")).toBe(true);
    for (const field of supplierQuestionnaire.fields) {
      const conditions = conditionsOf(field);
      if (conditions.length === 1 && conditions[0]?.field === "isOnPrem") {
        expect(visibleIds.has(field.id)).toBe(false);
      }
    }
  });

  test("a question with several conditions shows while any one of them holds", () => {
    const secure = supplierQuestionnaire.fields.find((f) => f.id === "secureDevelopment");
    if (!secure) throw new Error("secureDevelopment is missing");
    expect(isVisible(secure, { isSaas: true, isOnPrem: false })).toBe(true);
    expect(isVisible(secure, { isSaas: false, isOnPrem: true })).toBe(true);
    expect(isVisible(secure, { isSaas: false, isOnPrem: false })).toBe(false);
  });
});
