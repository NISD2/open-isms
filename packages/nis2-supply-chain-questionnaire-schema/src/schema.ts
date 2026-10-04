import { z } from "zod";

export const SECTION = {
  PROFILE: "profile",
  SECURITY_PRACTICES: "security_practices",
  SAAS_TECHNICAL: "saas_technical",
  ON_PREM_TECHNICAL: "on_prem_technical",
  PRO_SERVICES: "pro_services",
  MANAGED_SERVICES: "managed_services",
} as const;

export type SectionValue = (typeof SECTION)[keyof typeof SECTION];

export const sectionSchema = z.nativeEnum(SECTION);

export const FIELD_TYPE = {
  STRING: "string",
  TEXT: "text",
  EMAIL: "email",
  PHONE: "phone",
  URL: "url",
  /** A bare host name such as example.com: no scheme, no path. */
  DOMAIN: "domain",
  COUNTRY: "country",
  BOOLEAN: "boolean",
  ENUM: "enum",
  INTEGER: "integer",
} as const;

export type FieldTypeValue = (typeof FIELD_TYPE)[keyof typeof FIELD_TYPE];

export const fieldTypeSchema = z.nativeEnum(FIELD_TYPE);

const localisedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
  fr: z.string().min(1).optional(),
  it: z.string().min(1).optional(),
  es: z.string().min(1).optional(),
  pl: z.string().min(1).optional(),
  cs: z.string().min(1).optional(),
  pt: z.string().min(1).optional(),
  ro: z.string().min(1).optional(),
});

/** One answer that must hold for a question to show. */
export const conditionSchema = z.object({
  field: z.string().min(1),
  equals: z.union([z.boolean(), z.string(), z.number()]),
});

export type Condition = z.infer<typeof conditionSchema>;

const fieldOptionSchema = z.object({
  value: z.string().min(1),
  label: localisedString,
});

export const supplierFieldSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z][a-zA-Z0-9]*$/, "id must be camelCase"),
  section: sectionSchema,
  type: fieldTypeSchema,
  options: z.array(fieldOptionSchema).optional(),
  label: localisedString,
  description: localisedString,
  /**
   * Primary citation, stable form:
   *   "NIS2 Art. 21(2)(j)"
   *   "CIR 2024/2690 §5.1.4(d)"
   *   "ENISA TIG §5.1.2"
   *   "GDPR Art. 28"
   *
   * Anchored to EU-level instruments only — the directive, the
   * implementing regulation, and ENISA's technical guidance. National
   * derivatives (BSI IT-Grundschutz, ANSSI, CCB CyFun, etc.) are
   * downstream and live in their own extension repos.
   */
  legalBasis: z.string().min(1),
  required: z.boolean(),
  /** Shown only while another answer holds, or while any one of several holds. */
  visibleWhen: z
    .union([conditionSchema, z.object({ anyOf: z.array(conditionSchema).min(2) })])
    .optional(),
});

export const supplierQuestionnaireSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "version must be semver X.Y.Z"),
  lastUpdated: z.string(),
  fields: z.array(supplierFieldSchema).min(1),
});

export const supplierResponseSchema = z.record(
  z.string(),
  z.union([z.string(), z.boolean(), z.number(), z.null()]),
);

export type SupplierField = z.infer<typeof supplierFieldSchema>;
export type SupplierQuestionnaire = z.infer<typeof supplierQuestionnaireSchema>;
export type SupplierResponse = z.infer<typeof supplierResponseSchema>;

/** The conditions a question depends on: none, one, or any one of several. */
export const conditionsOf = (
  field: Pick<SupplierField, "visibleWhen">,
): readonly Condition[] => {
  const when = field.visibleWhen;
  if (!when) return [];
  return "anyOf" in when ? when.anyOf : [when];
};

/**
 * Whether a question with these conditions shows for these answers. Lives here, beside the types
 * and apart from the data, so a form can re-check visibility without loading every question.
 */
export const conditionsHold = (
  conditions: readonly Condition[],
  response: Record<string, unknown>,
): boolean =>
  conditions.length === 0 || conditions.some((c) => response[c.field] === c.equals);
