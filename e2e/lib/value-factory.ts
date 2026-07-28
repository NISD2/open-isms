/**
 * Deterministic test-value generation from the same introspection the form
 * library uses. FieldMeta in, schema-valid value out — no randomness, so
 * every run and every CI machine produces identical data.
 *
 * The factory is the drift alarm's engine: when a schema gains a field or a
 * constraint the factory cannot satisfy, the L0 parse test fails on the PR
 * that made the change.
 */
import type { z } from "zod";
import {
  introspectSchema,
  type FieldMeta,
} from "@/lib/forms/schema-introspect";

/** Fixed reference date: deterministic, in the recent past. */
const REFERENCE_DATE = "2026-01-15";

export function generateValue(meta: FieldMeta): unknown {
  switch (meta.type) {
    case "boolean":
      return true;
    case "enum":
      if (!meta.options || meta.options.length === 0) {
        throw new Error(`enum field "${meta.key}" has no options`);
      }
      return meta.options[0];
    case "number": {
      const base = meta.min ?? 1;
      return meta.max !== undefined ? Math.min(base, meta.max) : base;
    }
    case "date":
      return meta.jsDate ? new Date(REFERENCE_DATE) : REFERENCE_DATE;
    case "email":
      return `e2e-${meta.key.toLowerCase()}@nis2.local`;
    case "url":
      return `https://example.invalid/${meta.key}`;
    case "file":
      // File-convention fields are plain string columns holding a filename.
      return "e2e-evidence.pdf";
    case "array":
      return [];
    case "textarea":
    case "text":
    case "unknown":
    default: {
      let value = `E2E ${meta.key}`;
      if (meta.minLength !== undefined && value.length < meta.minLength) {
        value = value.padEnd(meta.minLength, "x");
      }
      if (meta.maxLength !== undefined && value.length > meta.maxLength) {
        value = value.slice(0, meta.maxLength);
      }
      return value;
    }
  }
}

/**
 * Full value set for a schema: generated defaults, persona overrides on top.
 * Overrides win by key; unknown override keys are the caller's drift problem
 * (the L0 tests assert every persona key exists in its schema).
 */
export function generateFormValues(
  schema: z.ZodObject<z.ZodRawShape>,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const meta of introspectSchema(schema, [])) {
    values[meta.key] =
      meta.key in overrides ? overrides[meta.key] : generateValue(meta);
  }
  return values;
}
