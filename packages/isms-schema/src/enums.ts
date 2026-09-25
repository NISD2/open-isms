import { pgEnum } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "guided", "enterprise"]);

/**
 * What a paying customer's companies may use. Free is the course and its certificate only;
 * grandfathered keeps the journey it had before invoicing existed; full is everything.
 */
export const accessLevelEnum = pgEnum("access_level", ["free", "grandfathered", "full"]);

/** Which door an order came through: the customer's own order page, or platform admin. */
export const invoiceSourceEnum = pgEnum("invoice_source", ["self_serve", "admin"]);

/** Each series has its own counter, because invoice and credit note numbers never share. */
export const documentSeriesEnum = pgEnum("document_series", ["invoice", "credit_note"]);

/**
 * How VAT was applied on an invoice, fixed at issue. The same four outcomes the billing code's VAT
 * treatment produces: German VAT, reverse charge on a confirmed EU number, German VAT on an EU
 * number the register could not confirm, and no German VAT outside the EU.
 */
export const vatTreatmentEnum = pgEnum("vat_treatment", [
  "domestic",
  "reverse_charge",
  "unconfirmed_eu",
  "outside_eu",
]);

/** A person's role inside one company. The same person can hold a different role elsewhere. */
export const membershipRoleEnum = pgEnum("membership_role", [
  "admin",
  "member",
  "reviewer",
  "legal_reviewer",
]);

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

export const changeTypeEnum = pgEnum("change_type", ["standard", "normal", "emergency"]);

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

export const urgencyEnum = pgEnum("urgency", ["info", "warning", "urgent", "critical"]);

export const vulnerabilityStatusEnum = pgEnum("vulnerability_status", [
  "discovered",
  "assessed",
  "treating",
  "resolved",
  "accepted",
  "mitigated",
]);

export const aiDataSharingEnum = pgEnum("ai_data_sharing", ["none", "basic", "full"]);

/**
 * How the journey lays itself out. Answers "who implements NIS 2 here", not
 * "how skilled are you": with one person doing everything the role swimlanes
 * describe a division of labour that does not exist, so "solo" renders a
 * single guided line and "team" keeps the role columns.
 */
export const journeyModeEnum = pgEnum("journey_mode", ["solo", "team"]);

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
