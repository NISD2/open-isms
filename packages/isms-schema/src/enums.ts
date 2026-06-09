import { pgEnum } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "guided", "enterprise"]);

export const itemStatusEnum = pgEnum("item_status", [
  "not_started",
  "in_progress",
  "completed",
  "not_applicable",
  "needs_review",
  "approved",
  "rejected",
]);

export const evidenceStatusEnum = pgEnum("evidence_status", [
  "draft",
  "in_review",
  "approved",
  "rejected",
  "expired",
]);

export const changeTypeEnum = pgEnum("change_type", [
  "standard",
  "normal",
  "emergency",
]);

export const changeStatusEnum = pgEnum("change_status", [
  "draft",
  "submitted",
  "approved",
  "implementing",
  "implemented",
  "rolled_back",
  "closed",
]);

export const patchStatusEnum = pgEnum("patch_status", [
  "pending",
  "applied",
  "exception",
  "not_applicable",
]);

export const auditStatusEnum = pgEnum("audit_status", [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const findingSeverityEnum = pgEnum("finding_severity", [
  "critical",
  "major",
  "minor",
  "observation",
]);

export const findingStatusEnum = pgEnum("finding_status", [
  "open",
  "in_progress",
  "resolved",
  "verified",
  "deferred",
]);

export const improvementSourceEnum = pgEnum("improvement_source", [
  "audit",
  "incident",
  "pentest",
  "management_review",
  "kpi_breach",
  "gap_analysis",
  "regulatory_change",
  "suggestion",
]);

export const treatmentStatusEnum = pgEnum("treatment_status", [
  "not_started",
  "in_progress",
  "completed",
  "verified",
]);

export const exerciseTypeEnum = pgEnum("exercise_type", [
  "tabletop",
  "technical",
  "red_team",
  "full_scale",
]);

export const kpiStatusEnum = pgEnum("kpi_status", ["green", "amber", "red"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "in_app",
  "webhook",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "acknowledged",
  "escalated",
  "cancelled",
]);

export const urgencyEnum = pgEnum("urgency", [
  "info",
  "warning",
  "urgent",
  "critical",
]);

export const vulnerabilityStatusEnum = pgEnum("vulnerability_status", [
  "discovered",
  "assessed",
  "treating",
  "resolved",
  "accepted",
  "mitigated",
]);

export const aiDataSharingEnum = pgEnum("ai_data_sharing", [
  "none",
  "basic",
  "full",
]);

export const supplierPublicationEventTypeEnum = pgEnum(
  "supplier_publication_event_type",
  [
    "questionnaire_updated",
    "certification_added",
    "certification_expiring",
    "incident_published",
    "subprocessor_changed",
    "service_catalog_changed",
  ],
);

export const leadIntentEnum = pgEnum("lead_intent", [
  "entity",
  "supplier",
  "both",
  "unknown",
]);

export const incidentReportTypeEnum = pgEnum("incident_report_type", [
  "early_warning",
  "notification",
  "intermediate",
  "final",
  "progress",
]);

export const supplierPublicationBroadcastStatusEnum = pgEnum(
  "supplier_publication_broadcast_status",
  ["queued", "sending", "sent", "failed"],
);
