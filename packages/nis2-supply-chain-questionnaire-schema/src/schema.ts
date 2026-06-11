import { z } from "zod";

export const SECTION = {
  PROFILE: "profile",
  SECURITY_PRACTICES: "security_practices",
  SAAS_TECHNICAL: "saas_technical",
  ON_PREM_TECHNICAL: "on_prem_technical",
  PRO_SERVICES: "pro_services",
  MANAGED_SERVICES: "managed_services",
} as const;

export type SectionValue = typeof SECTION[keyof typeof SECTION];

export const sectionSchema = z.nativeEnum(SECTION);

export const FIELD_TYPE = {
  STRING: "string",
  TEXT: "text",
  EMAIL: "email",
  PHONE: "phone",
  URL: "url",
  COUNTRY: "country",
  BOOLEAN: "boolean",
  ENUM: "enum",
  INTEGER: "integer",
} as const;

export type FieldTypeValue = typeof FIELD_TYPE[keyof typeof FIELD_TYPE];

export const fieldTypeSchema = z.nativeEnum(FIELD_TYPE);

const localisedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
});

const fieldOptionSchema = z.object({
  value: z.string().min(1),
  label: localisedString,
});

export const supplierFieldSchema = z.object({
  id: z.string().min(1).regex(/^[a-z][a-zA-Z0-9]*$/, "id must be camelCase"),
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
  visibleWhen: z
    .object({
      field: z.string().min(1),
      equals: z.union([z.boolean(), z.string(), z.number()]),
    })
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
