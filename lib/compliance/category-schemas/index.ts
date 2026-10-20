/**
 * The intake schemas of every framework, by category code: one Zod schema per category, fed to
 * SchemaForm on the requirement page and to the walk's field screens. Each framework keeps its own
 * module (./nis2, ./gdpr); category codes are unique across frameworks, so one registry serves
 * them all.
 */
import type { z } from "zod";
import { GDPR_FIELD_MAPPING, GDPR_SCHEMAS } from "./gdpr";
import { NIS2_FIELD_MAPPING, NIS2_SCHEMAS } from "./nis2";

const SCHEMA_BY_CATEGORY = { ...NIS2_SCHEMAS, ...GDPR_SCHEMAS } as const;

export type CategoryCode = keyof typeof SCHEMA_BY_CATEGORY;

/**
 * An intake field of one category, so a misspelt key fails `tsc` rather than a test. Distributes
 * over a union, so `CategoryField<CategoryCode>` is every field rather than none.
 */
export type CategoryField<C extends CategoryCode> = C extends CategoryCode
  ? keyof (typeof SCHEMA_BY_CATEGORY)[C]["shape"] & string
  : never;

export const CATEGORY_SCHEMAS: Record<
  string,
  z.ZodObject<z.ZodRawShape>
> = SCHEMA_BY_CATEGORY as unknown as Record<string, z.ZodObject<z.ZodRawShape>>;

/**
 * Maps each intake field to the requirement codes it satisfies, per category. Used to
 * auto-derive companyRequirementStatus when intake is submitted.
 */
export const CATEGORY_FIELD_MAPPING: Record<string, Record<string, string[]>> = {
  ...NIS2_FIELD_MAPPING,
  ...GDPR_FIELD_MAPPING,
};
