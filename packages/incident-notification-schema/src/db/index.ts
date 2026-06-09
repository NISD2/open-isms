/**
 * Drizzle persistence layer for NIS 2 Art. 23 incident notification
 * reports. Optional companion to the static schema spec.
 *
 * Consumers who only want the field metadata (labels, legal anchors,
 * portal mappings) should import from the package root and skip this
 * entry. This module pulls in `drizzle-orm`.
 *
 * Pairs with any consumer-side incident entity via the loose string
 * foreign key `incidentId` on `incidentNotificationReport`.
 */

export {
  incidentNotificationReport,
  incidentNotificationValue,
  REPORT_TYPE_VALUES,
  REPORT_STATUS_VALUES,
  type IncidentNotificationReport,
  type NewIncidentNotificationReport,
  type IncidentNotificationValue,
  type NewIncidentNotificationValue,
} from "./tables";

export {
  incidentNotificationReportRelations,
  incidentNotificationValueRelations,
} from "./relations";

export {
  validateReportSubmission,
  type SubmissionValues,
  type ValidationIssue,
  type ValidationResult,
} from "./validate";
