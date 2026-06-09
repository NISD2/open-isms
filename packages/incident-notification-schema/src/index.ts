// Explicit re-exports — `export *` was dropping type-only re-exports
// through some downstream typecheckers and consumers ended up with
// `unknown` for the inferred types. Listing symbols explicitly avoids
// the ambiguity. (Same pattern as the supply-chain-questionnaire schema.)

export {
  REPORT_TYPE,
  REPORT_TYPE_DPV_URI,
  SECTION,
  FIELD_TYPE,
  reportTypeSchema,
  sectionSchema,
  fieldTypeSchema,
  incidentFieldSchema,
  incidentNotificationSchemaShape,
  incidentSubmissionValueSchema,
  incidentSubmissionSchema,
} from "./schema";

export type {
  ReportTypeValue,
  SectionValue,
  FieldTypeValue,
  IncidentField,
  IncidentNotificationSchema,
  IncidentSubmission,
  IncidentSubmissionValue,
  LocalisedString,
  LegalCitation,
  NationalPortalMapping,
  CrossRegulationOverlap,
} from "./schema";

export {
  incidentNotificationSchema,
  groupBySection,
  fieldsRequiredFor,
  fieldsOptionalFor,
  fieldById,
} from "./data";
