/**
 * BSI Incident Reporting — BSIG §32 Meldeportal workflow
 *
 * Tracks BSI-specific incident metadata (case numbers, BKA forwarding)
 * and individual report submissions to the BSI Meldeportal.
 * Reporting deadlines: 24h early warning, 72h notification, 1-month final report.
 *
 * References: incident, user
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { incidentReportTypeEnum } from "../../enums";
import { incident } from "@nisd2/grc-data-model/schema";
import { user } from "@nisd2/isms-schema/tables/organization";

// ---------------------------------------------------------------------------
// BSI Incident Report — Meldeportal submissions (24h, 72h, intermediate, final)
// ---------------------------------------------------------------------------

export const bsiIncidentReport = pgTable(
  "bsi_incident_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    incidentId: uuid("incident_id")
      .references(() => incident.id)
      .notNull(),
    reportType: incidentReportTypeEnum("report_type").notNull(),

    // Deadlines
    dueAt: timestamp("due_at").notNull(),
    submittedAt: timestamp("submitted_at"),
    isOverdue: boolean("is_overdue").default(false),

    // Report content (typed columns matching BSI Meldeportal)
    summary: text("summary"),
    newInformation: text("new_information"),
    remediationStatus: text("remediation_status"),
    rootCauseAnalysis: text("root_cause_analysis"),
    lessonsLearned: text("lessons_learned"),

    // BSI response
    bsiAcknowledgedAt: timestamp("bsi_acknowledged_at"),
    bsiGuidanceReceived: text("bsi_guidance_received"),

    createdBy: uuid("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_bsi_incident_report_incident").on(table.incidentId),
    index("idx_bsi_incident_report_due").on(table.dueAt),
    index("idx_bsi_incident_report_overdue").on(table.isOverdue),
  ]
);
