import { z } from "zod";

// ---------------------------------------------------------------------------
// Report types — aligned with W3C DPV NIS 2 vocabulary v2.3
// https://w3c.github.io/dpv/2.3/legal/eu/nis2/
//
// These are the canonical NIS 2 Art. 23(4) report stages. Each carries a
// stable persistent URI from the W3C DPV vocabulary so consumers can
// interoperate with the wider semantic-web ecosystem without remapping.
// ---------------------------------------------------------------------------

export const REPORT_TYPE = {
  EARLY_WARNING: "earlyWarning",
  INCIDENT_NOTIFICATION: "incidentNotification",
  INTERMEDIATE: "intermediate",
  PROGRESS: "progress",
  FINAL: "final",
} as const;

export type ReportTypeValue = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

export const reportTypeSchema = z.nativeEnum(REPORT_TYPE);

export const REPORT_TYPE_DPV_URI: Record<ReportTypeValue, string> = {
  [REPORT_TYPE.EARLY_WARNING]:
    "https://w3id.org/dpv/legal/eu/nis2#EarlyWarningReport",
  [REPORT_TYPE.INCIDENT_NOTIFICATION]:
    "https://w3id.org/dpv/legal/eu/nis2#IncidentAssessmentReport",
  [REPORT_TYPE.INTERMEDIATE]:
    "https://w3id.org/dpv/legal/eu/nis2#IntermediateReport",
  [REPORT_TYPE.PROGRESS]:
    "https://w3id.org/dpv/legal/eu/nis2#ProgressReport",
  [REPORT_TYPE.FINAL]:
    "https://w3id.org/dpv/legal/eu/nis2#FinalReport",
};

// ---------------------------------------------------------------------------
// Sections — the field grouping used in the schema. EU-anchored, neutral of
// any specific national portal. National portals (BSI Meldeportal, ANSSI,
// NCSC-NL, etc.) map their own screen names onto these sections via the
// `nationalPortalMappings` field on each field.
// ---------------------------------------------------------------------------

export const SECTION = {
  CLASSIFICATION: "classification",
  DESCRIPTION: "description",
  TIMING: "timing",
  GEOGRAPHIC_SECTORAL: "geographicSectoral",
  CAUSATION: "causation",
  RESPONSE_MEASURES: "responseMeasures",
  AFFECTED_ASSETS: "affectedAssets",
  AFFECTED_SUPPLIERS: "affectedSuppliers",
  IMPACT: "impact",
  CROSS_BORDER: "crossBorder",
  CRIMINAL_PROSECUTION: "criminalProsecution",
  REPORTER_CONTACT: "reporterContact",
  SECTORAL_OVERLAY: "sectoralOverlay",
} as const;

export type SectionValue = (typeof SECTION)[keyof typeof SECTION];

export const sectionSchema = z.nativeEnum(SECTION);

// ---------------------------------------------------------------------------
// Field types — primitive shapes for value validation
// ---------------------------------------------------------------------------

export const FIELD_TYPE = {
  STRING: "string",
  TEXT: "text",
  EMAIL: "email",
  PHONE: "phone",
  URL: "url",
  COUNTRY: "country",
  COUNTRY_LIST: "countryList",
  BOOLEAN: "boolean",
  ENUM: "enum",
  MULTI_ENUM: "multiEnum",
  INTEGER: "integer",
  DECIMAL: "decimal",
  DATETIME: "datetime",
} as const;

export type FieldTypeValue = (typeof FIELD_TYPE)[keyof typeof FIELD_TYPE];

export const fieldTypeSchema = z.nativeEnum(FIELD_TYPE);

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const localisedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
  fr: z.string().min(1).optional(),
  it: z.string().min(1).optional(),
  es: z.string().min(1).optional(),
  pl: z.string().min(1).optional(),
});

export type LocalisedString = z.infer<typeof localisedString>;

const fieldOptionSchema = z.object({
  value: z.string().min(1),
  label: localisedString,
});

const legalCitationSchema = z.object({
  /**
   * Stable citation form. EU-level instruments only at this layer:
   *   "NIS 2 Art. 23(4)(a)"
   *   "NIS 2 Art. 23(2)"
   *   "CIR 2024/2690 §3.1"
   *   "ENISA TIG §4.5"
   *   "NIS Cooperation Group Common Template 2026 §X" (placeholder until
   *   the Commission Implementing Regulation publishes)
   */
  citation: z.string().min(1),
  url: z.string().url().optional(),
});

export type LegalCitation = z.infer<typeof legalCitationSchema>;

/**
 * National portal mapping. Keyed by ISO 3166-1 alpha-2 country code,
 * values describe which screen and which native field name a national
 * authority's portal uses for the EU-level field.
 *
 * Today only the DE/BSI mapping is populated. Other member states are
 * placeholder slots — contributions welcome. Mapping content lives in
 * the dual-licensed `docs/` folder.
 */
const nationalPortalMappingSchema = z.object({
  /** ISO 3166-1 alpha-2 — "DE", "FR", "NL", "AT", "IT", "ES", ... */
  countryCode: z.string().length(2),
  /** Name of the national portal screen / section / page. */
  portalScreen: z.string().min(1),
  /** Field name as the portal prompts it (verbatim where possible). */
  portalFieldName: z.string().min(1).optional(),
  /** Notes about how the mapping deviates from the EU field. */
  notes: z.string().optional(),
});

export type NationalPortalMapping = z.infer<typeof nationalPortalMappingSchema>;

/**
 * Cross-regulation overlap. The same incident often triggers reporting
 * under multiple EU regimes — NIS 2 + GDPR (personal data), NIS 2 +
 * DORA (financial sector), NIS 2 + CER (physical/critical-entity),
 * NIS 2 + eIDAS (trust services). The Digital Omnibus single-entry
 * point (proposed Art. 23a) will collapse these into one submission;
 * until then, this schema's overlap pointers let consumers replay one
 * collected field into multiple downstream report formats.
 */
const crossRegulationOverlapSchema = z.object({
  /** "GDPR Art. 33", "DORA Art. 19", "CER Art. 15", "eIDAS Art. 19" */
  instrument: z.string().min(1),
  /** Equivalent field name or paragraph reference in the other instrument. */
  fieldReference: z.string().min(1),
  notes: z.string().optional(),
});

export type CrossRegulationOverlap = z.infer<
  typeof crossRegulationOverlapSchema
>;

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

export const incidentFieldSchema = z.object({
  /** camelCase identifier, stable across versions. */
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
   * Which report types require this field. May be empty for fields that
   * are entirely optional across all stages (e.g. reporter phone). Each
   * field must apply somewhere — see the refine() at the bottom of the
   * schema definition.
   */
  requiredIn: z.array(reportTypeSchema).default([]),
  /**
   * Optional report types where the field MAY be supplied but is not
   * required. Useful for fields that are only collected if available
   * (e.g. estimated financial damage in Early Warning).
   */
  optionalIn: z.array(reportTypeSchema).default([]),
  /** Primary EU-level legal anchor. */
  legalBasis: z.array(legalCitationSchema).min(1),
  /**
   * W3C DPV NIS 2 vocabulary URI, where one applies. Field-level URIs
   * are sparse in DPV 2.3 (most coverage is at the report-type level).
   * Use the report-type URIs from REPORT_TYPE_DPV_URI for the parent
   * report type.
   */
  w3cDpvUri: z.string().url().optional(),
  /**
   * Cooperation Group Common Template field reference, populated once
   * the Commission Implementing Regulation publishes the templates
   * adopted on 26 May 2026 by the NIS Cooperation Group.
   */
  coopGroupTemplateFieldId: z.string().optional(),
  /** National portal field mappings (DE/BSI populated, others stubs). */
  nationalPortalMappings: z.array(nationalPortalMappingSchema).default([]),
  /** Cross-regulation field overlaps for "report once, share many". */
  crossRegulationOverlaps: z
    .array(crossRegulationOverlapSchema)
    .default([]),
  /**
   * Conditional applicability. A field may only apply to certain
   * sectors (e.g. LuftSiG aviation overlay fields), certain entity
   * types, or certain incident categories.
   */
  appliesIf: z
    .object({
      sectors: z.array(z.string()).optional(),
      entityTypes: z.array(z.string()).optional(),
      reportingReasons: z.array(z.string()).optional(),
    })
    .optional(),
}).refine(
  (field) => field.requiredIn.length > 0 || field.optionalIn.length > 0,
  {
    message:
      "field must be required or optional in at least one report type",
    path: ["requiredIn"],
  },
);

export type IncidentField = z.infer<typeof incidentFieldSchema>;

// ---------------------------------------------------------------------------
// Top-level schema
// ---------------------------------------------------------------------------

export const incidentNotificationSchemaShape = z.object({
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "version must be semver X.Y.Z"),
  lastUpdated: z.string(),
  /**
   * Primary EU-level instruments this schema is anchored to. The
   * collection is closed at the directive + implementing regulation +
   * ENISA TIG + W3C DPV + Cooperation Group templates layer. National
   * portal mappings live as per-field metadata, not at the top level.
   */
  euInstruments: z.array(legalCitationSchema).min(1),
  reportTypes: z.array(reportTypeSchema).min(1),
  fields: z.array(incidentFieldSchema).min(1),
});

export type IncidentNotificationSchema = z.infer<
  typeof incidentNotificationSchemaShape
>;

// ---------------------------------------------------------------------------
// Submitted incident payload — what an entity actually fills in
// ---------------------------------------------------------------------------

export const incidentSubmissionValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.number(),
  z.array(z.string()),
  z.null(),
]);

export type IncidentSubmissionValue = z.infer<
  typeof incidentSubmissionValueSchema
>;

export const incidentSubmissionSchema = z.object({
  reportType: reportTypeSchema,
  schemaVersion: z.string(),
  values: z.record(z.string(), incidentSubmissionValueSchema),
});

export type IncidentSubmission = z.infer<typeof incidentSubmissionSchema>;
