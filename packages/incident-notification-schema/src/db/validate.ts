import {
  incidentNotificationSchema,
  fieldsRequiredFor,
  fieldsOptionalFor,
  fieldById,
} from "../data";
import type {
  ReportTypeValue,
  IncidentNotificationSchema,
} from "../schema";

export type SubmissionValues = Record<string, unknown>;

export type ValidationIssue = {
  fieldId: string;
  message: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; issues: ReadonlyArray<ValidationIssue> };

/**
 * Validate a submission payload against the static field spec for a
 * given report type. Checks:
 *   - all required fields present
 *   - submitted field ids exist in the spec
 *   - enum / multiEnum values are among the allowed options
 *   - primitive types loosely match (string/text/email/url/datetime as
 *     string; boolean as boolean; integer/decimal as number;
 *     country/countryList as string/string[]; multiEnum as string[])
 *
 * Pass `schema` to validate against a non-canonical spec instance
 * (e.g. an older snapshot stored at report submission time).
 */
export function validateReportSubmission(
  reportType: ReportTypeValue,
  values: SubmissionValues,
  schema: IncidentNotificationSchema = incidentNotificationSchema,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const required = fieldsRequiredFor(reportType, schema);
  const optional = fieldsOptionalFor(reportType, schema);
  const validIds = new Set([
    ...required.map((f) => f.id),
    ...optional.map((f) => f.id),
  ]);

  for (const field of required) {
    if (!(field.id in values) || values[field.id] === null || values[field.id] === undefined) {
      issues.push({
        fieldId: field.id,
        message: `required for report type "${reportType}"`,
      });
    }
  }

  for (const [fieldId, rawValue] of Object.entries(values)) {
    if (rawValue === null || rawValue === undefined) continue;

    if (!validIds.has(fieldId)) {
      issues.push({
        fieldId,
        message: `not declared as required or optional in report type "${reportType}"`,
      });
      continue;
    }

    const field = fieldById(fieldId, schema);
    if (!field) {
      issues.push({
        fieldId,
        message: "field id not found in schema",
      });
      continue;
    }

    switch (field.type) {
      case "string":
      case "text":
      case "email":
      case "phone":
      case "url":
      case "country":
      case "datetime":
        if (typeof rawValue !== "string") {
          issues.push({
            fieldId,
            message: `expected string, got ${typeof rawValue}`,
          });
        }
        break;
      case "boolean":
        if (typeof rawValue !== "boolean") {
          issues.push({
            fieldId,
            message: `expected boolean, got ${typeof rawValue}`,
          });
        }
        break;
      case "integer":
      case "decimal":
        if (typeof rawValue !== "number") {
          issues.push({
            fieldId,
            message: `expected number, got ${typeof rawValue}`,
          });
        }
        break;
      case "enum": {
        if (typeof rawValue !== "string") {
          issues.push({
            fieldId,
            message: `expected string (enum value), got ${typeof rawValue}`,
          });
          break;
        }
        const allowed = (field.options ?? []).map((o) => o.value);
        if (!allowed.includes(rawValue)) {
          issues.push({
            fieldId,
            message: `value "${rawValue}" not in allowed options [${allowed.join(", ")}]`,
          });
        }
        break;
      }
      case "multiEnum":
      case "countryList": {
        if (!Array.isArray(rawValue)) {
          issues.push({
            fieldId,
            message: `expected array, got ${typeof rawValue}`,
          });
          break;
        }
        const nonString = rawValue.find((v) => typeof v !== "string");
        if (nonString !== undefined) {
          issues.push({
            fieldId,
            message: `array must contain only strings`,
          });
          break;
        }
        if (field.type === "multiEnum") {
          const allowed = new Set((field.options ?? []).map((o) => o.value));
          const invalid = rawValue.filter((v) => !allowed.has(v as string));
          if (invalid.length > 0) {
            issues.push({
              fieldId,
              message: `values [${invalid.join(", ")}] not in allowed options`,
            });
          }
        }
        break;
      }
    }
  }

  return issues.length === 0
    ? { ok: true }
    : { ok: false, issues };
}
