/**
 * Schema Introspection — Extract field metadata from a Zod v4 schema
 *
 * Walks a ZodObject's `.shape` and reads each field's type, constraints,
 * and format to determine what UI component should render it.
 *
 * Zod v4 API (different from v3):
 *   _def.type      → "string", "number", "boolean", "enum", "optional", "nullable", "default", "date", "array"
 *   field.format   → "email", "url", "uuid", "safeint", etc.
 *   field.minLength / maxLength → string length constraints
 *   field.minValue / maxValue   → number constraints
 *   field.isInt                 → boolean
 *   field.options               → enum values (string[])
 *   _def.innerType             → unwrap optional/nullable/default
 *   _def.defaultValue          → default value
 */
import type { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "boolean"
  | "enum"
  | "date"
  | "file"
  | "array"
  | "unknown";

export interface FieldMeta {
  key: string;
  type: FieldType;
  required: boolean;
  defaultValue?: unknown;
  options?: readonly string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  isInteger?: boolean;
  /** True when the schema expects a JS Date (z.date / timestamp column) rather than an ISO string (z.iso.date / pg date column). */
  jsDate?: boolean;
  label: string;
}

// ============================================================================
// Introspection
// ============================================================================

export function introspectSchema(
  schema: z.ZodObject<z.ZodRawShape>,
  omit: string[] = ["id", "createdAt", "updatedAt"],
): FieldMeta[] {
  const shape = schema.shape;
  const fields: FieldMeta[] = [];

  for (const [key, zodType] of Object.entries(shape)) {
    if (omit.includes(key)) continue;
    fields.push(introspectField(key, zodType as z.ZodType));
  }

  return fields;
}

function introspectField(key: string, zodType: z.ZodType): FieldMeta {
  const meta: FieldMeta = {
    key,
    type: "text",
    required: true,
    label: humanize(key),
  };

  resolveType(zodType, meta);

  // Convention: string fields ending in Uploaded/Documented/Published are file uploads
  if (meta.type === "text" && /(?:Uploaded|Documented|Published)$/.test(key)) {
    meta.type = "file";
  }

  return meta;
}

// ============================================================================
// Recursive type resolution for Zod v4
// ============================================================================

function resolveType(zodType: any, meta: FieldMeta): void {
  const defType: string | undefined = zodType?._def?.type;

  switch (defType) {
    // --- Wrappers: unwrap and recurse ---
    case "optional":
      meta.required = false;
      if (zodType._def.innerType) resolveType(zodType._def.innerType, meta);
      return;

    case "nullable":
      meta.required = false;
      if (zodType._def.innerType) resolveType(zodType._def.innerType, meta);
      return;

    case "default":
      meta.required = false;
      meta.defaultValue = zodType._def.defaultValue;
      if (zodType._def.innerType) resolveType(zodType._def.innerType, meta);
      return;

    // --- Leaf types ---
    case "string":
      resolveStringType(zodType, meta);
      return;

    case "number":
      meta.type = "number";
      resolveNumberType(zodType, meta);
      return;

    case "boolean":
      meta.type = "boolean";
      return;

    case "enum":
      meta.type = "enum";
      meta.options = zodType.options ?? Object.values(zodType._def.entries ?? {});
      return;

    case "date":
      meta.type = "date";
      meta.jsDate = true;
      return;

    case "array":
      meta.type = "array";
      return;

    // --- Pipe/transform (drizzle-zod sometimes wraps with pipe) ---
    case "pipe":
      if (zodType._def.in) resolveType(zodType._def.in, meta);
      return;

    default:
      meta.type = "unknown";
  }
}

function resolveStringType(zodType: any, meta: FieldMeta): void {
  meta.type = "text";

  // Check format (zod v4: .email(), .url(), .uuid(), z.iso.date() set .format)
  const format: string | undefined = zodType.format;
  if (format === "email") {
    meta.type = "email";
  } else if (format === "url") {
    meta.type = "url";
  } else if (format === "date") {
    meta.type = "date";
  }
  // uuid stays as "text" (usually hidden/omitted)

  // Length constraints (zod v4: direct properties)
  if (zodType.minLength != null) meta.minLength = zodType.minLength;
  if (zodType.maxLength != null) meta.maxLength = zodType.maxLength;

  // Heuristic: long max length → textarea
  if (meta.maxLength && meta.maxLength > 255 && meta.type === "text") {
    meta.type = "textarea";
  }
}

function resolveNumberType(zodType: any, meta: FieldMeta): void {
  if (zodType.isInt) meta.isInteger = true;
  if (zodType.minValue != null) meta.min = zodType.minValue;
  if (zodType.maxValue != null && zodType.maxValue < Number.MAX_SAFE_INTEGER) {
    meta.max = zodType.maxValue;
  }
}

// ============================================================================
// Helpers
// ============================================================================

export function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}
