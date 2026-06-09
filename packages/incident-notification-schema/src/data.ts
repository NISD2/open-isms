import {
  incidentNotificationSchemaShape,
  REPORT_TYPE,
  type IncidentNotificationSchema,
  type IncidentField,
  type ReportTypeValue,
  type SectionValue,
} from "./schema";
import { allIncidentFields } from "./fields";

const VERSION = "0.3.0";
const LAST_UPDATED = "2026-06-03";

/**
 * The canonical schema instance — pass this object around in code.
 * Validation is performed at build time via the assertion below.
 */
export const incidentNotificationSchema: IncidentNotificationSchema = {
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  euInstruments: [
    {
      citation: "Directive (EU) 2022/2555 (NIS 2) Art. 23",
      url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
    },
    {
      citation: "Commission Implementing Regulation (EU) 2024/2690 (CIR)",
      url: "https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj",
    },
    {
      citation:
        "ENISA Technical Implementation Guidance v1.0 (June 2025)",
      url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
    },
    {
      citation:
        "NIS Cooperation Group Common Notification Templates (adopted 26 May 2026; Commission Implementing Regulation pending)",
      url: "https://digital-strategy.ec.europa.eu/en/news/nis2-cooperation-group-adopts-common-templates-incident-reporting",
    },
    {
      citation: "W3C DPV NIS 2 Vocabulary v2.3 (25 February 2026)",
      url: "https://w3c.github.io/dpv/2.3/legal/eu/nis2/",
    },
  ],
  reportTypes: [
    REPORT_TYPE.EARLY_WARNING,
    REPORT_TYPE.INCIDENT_NOTIFICATION,
    REPORT_TYPE.INTERMEDIATE,
    REPORT_TYPE.PROGRESS,
    REPORT_TYPE.FINAL,
  ],
  fields: [...allIncidentFields],
};

// Self-validation: assert the assembled schema actually conforms to its
// own Zod definition. Throws at module load if not, catching authoring
// drift early (e.g. a field with no requiredIn entries, an illegal id).
incidentNotificationSchemaShape.parse(incidentNotificationSchema);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Group fields by their section, preserving the order in which sections
 * first appear in the field list.
 */
export function groupBySection(
  schema: IncidentNotificationSchema = incidentNotificationSchema,
): ReadonlyArray<{ section: SectionValue; fields: ReadonlyArray<IncidentField> }> {
  const order: SectionValue[] = [];
  const byKey = new Map<SectionValue, IncidentField[]>();
  for (const field of schema.fields) {
    let bucket = byKey.get(field.section);
    if (!bucket) {
      bucket = [];
      byKey.set(field.section, bucket);
      order.push(field.section);
    }
    bucket.push(field);
  }
  return order.map((section) => {
    const fields = byKey.get(section);
    if (!fields) {
      // groupBySection only pushes to `order` after setting the bucket,
      // so this branch is structurally unreachable. Throw rather than
      // narrow with a non-null assertion (CLAUDE.md rule).
      throw new Error(`incident-schema: section ${section} not initialised`);
    }
    return { section, fields };
  });
}

/**
 * Return the fields required for a given report type.
 */
export function fieldsRequiredFor(
  reportType: ReportTypeValue,
  schema: IncidentNotificationSchema = incidentNotificationSchema,
): ReadonlyArray<IncidentField> {
  return schema.fields.filter((field) =>
    field.requiredIn.includes(reportType),
  );
}

/**
 * Return the fields a given report type may optionally include
 * (whether or not the entity has the data at this stage).
 */
export function fieldsOptionalFor(
  reportType: ReportTypeValue,
  schema: IncidentNotificationSchema = incidentNotificationSchema,
): ReadonlyArray<IncidentField> {
  return schema.fields.filter((field) =>
    field.optionalIn.includes(reportType),
  );
}

/**
 * Return the field definition for a given id, or undefined if not found.
 */
export function fieldById(
  id: string,
  schema: IncidentNotificationSchema = incidentNotificationSchema,
): IncidentField | undefined {
  return schema.fields.find((field) => field.id === id);
}
