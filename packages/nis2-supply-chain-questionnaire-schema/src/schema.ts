import { z } from "zod";

export const SECTION = {
  PROFILE: "profile",
  SECURITY_PRACTICES: "security_practices",
  SAAS_TECHNICAL: "saas_technical",
  ON_PREM_TECHNICAL: "on_prem_technical",
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
   * Citations, stable form, separated by "; ":
   *   "CIR 2024/2690 §5.1.4(d)"
   *   "CIR 2024/2690 §5.1.2(a); §11.7"
   *   "ENISA TIG §5.1.2"
   *   "GDPR Art. 28(3)"
   *
   * The first names why a customer asks its supplier (NIS 2 Art. 21(2)(d)
   * and (3), CIR 2024/2690 point 5); any further one names the practice the
   * answer is measured against. A citation of the customer's own security
   * areas never stands alone, because those bind the customer, not the
   * supplier. EU-level instruments only; national derivatives (BSI
   * IT-Grundschutz, ANSSI, CCB CyFun, etc.) live in their own extension repos.
   */
  legalBasis: z.string().min(1),
  /**
   * ISO/IEC 27001:2022 Annex A controls the question serves, taken from
   * ENISA's mapping of CIR 2024/2690 to ISO/IEC 27001 (Technical
   * Implementation Guidance mapping table, version 1.2). For customers who
   * manage suppliers under ISO 27001 rather than NIS 2.
   */
  iso27001: z
    .array(z.string().regex(/^A\.[5-8]\.\d{1,2}$/, "an Annex A control such as A.5.19"))
    .min(1)
    .optional(),
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
