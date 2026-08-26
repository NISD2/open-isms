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

/** Fixed reference dates: deterministic, in the recent past. */
const REFERENCE_DATE = "2026-01-15";
const ALT_REFERENCE_DATE = "2026-02-20";

/**
 * "alt" exercises a second point in each field's value space: the LAST enum
 * option instead of the first, a different date, different strings, the
 * upper numeric bound. One alt pass per form covers the option variety a
 * single fixed dataset would miss.
 */
export type FactoryMode = "default" | "alt";

export function generateValue(meta: FieldMeta, mode: FactoryMode = "default"): unknown {
  const alt = mode === "alt";
  switch (meta.type) {
    case "boolean":
      return true;
    case "enum":
      if (!meta.options || meta.options.length === 0) {
        throw new Error(`enum field "${meta.key}" has no options`);
      }
      return alt ? meta.options[meta.options.length - 1] : meta.options[0];
    case "number": {
      // drizzle-zod stamps int32 bounds on plain integer columns; those are
      // storage limits, not domain constraints. Treat huge bounds as absent
      // so scale fields (risk 1-4 selects, counts) get sensible values.
      const min = meta.min !== undefined && Math.abs(meta.min) < 1_000_000 ? meta.min : undefined;
      const max = meta.max !== undefined && Math.abs(meta.max) < 1_000_000 ? meta.max : undefined;
      const base = min ?? 1;
      if (alt && max !== undefined) return max;
      return max !== undefined ? Math.min(base, max) : base;
    }
    case "date": {
      const iso = alt ? ALT_REFERENCE_DATE : REFERENCE_DATE;
      return meta.jsDate ? new Date(iso) : iso;
    }
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
      let value = `${alt ? "Alt" : "E2E"} ${meta.key}`;
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
  mode: FactoryMode = "default",
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const meta of introspectSchema(schema, [])) {
    values[meta.key] =
      meta.key in overrides ? overrides[meta.key] : generateValue(meta, mode);
  }
  return values;
}
