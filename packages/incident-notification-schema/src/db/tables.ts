import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Persistence layer for NIS 2 Art. 23 notification submissions.
 *
 * These tables store the actual reports an entity has sent to its
 * CSIRT / competent authority across the reporting cycle:
 *
 *   24h early warning → 72h notification → intermediate (on request)
 *   → progress (if still open at 1 month) → final (within 1 month
 *   of resolution).
 *
 * The static field spec lives in `../fields/`; this layer stores the
 * values that were submitted, per report instance, with a full audit
 * trail (one row per field per report). Treat these as append-only:
 * never UPDATE a submitted value, always insert a new value for a new
 * report. That preserves the regulator-visible record of what was said
 * and when.
 *
 * Coupling note: `incidentId` is a loose string foreign key. Consumers
 * are expected to wire this to their own incident entity (e.g. the
 * `incident` table in `@nisd2/grc-data-model`, or anything else). The
 * package intentionally does not import that schema so it remains
 * usable standalone.
 */

export const REPORT_TYPE_VALUES = [
  "earlyWarning",
  "incidentNotification",
  "intermediate",
  "progress",
  "final",
] as const;

export const REPORT_STATUS_VALUES = [
  "draft",
  "submitted",
  "acknowledged",
  "withdrawn",
] as const;

export const incidentNotificationReport = pgTable(
  "incident_notification_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Loose foreign key to the consumer's own incident entity.
     * Stored as text rather than uuid because consumer incident keys
     * may not be UUIDs (could be a slug, an internal ref, etc.).
     */
    incidentId: text("incident_id").notNull(),

    /** One of REPORT_TYPE_VALUES — earlyWarning / incidentNotification / intermediate / progress / final. */
    reportType: text("report_type", { enum: REPORT_TYPE_VALUES }).notNull(),

    /**
     * Optional self-reference: a 72h notification typically points back
     * to the 24h early warning it updates; the final report points to
     * the 72h notification. Useful for assembling the full cascade.
     */
    parentReportId: uuid("parent_report_id"),

    /** Semver of `@nisd2/incident-notification-schema` at submission time. */
    schemaVersion: text("schema_version").notNull(),

    /** Wall-clock time the entity considers the report "sent". Null until submitted. */
    submittedAt: timestamp("submitted_at", { withTimezone: true }),

    /**
     * National portal receipt / case reference, if the portal returns one
     * (BSI Meldeportal does, ANSSI does, etc.).
     */
    portalReceipt: text("portal_receipt"),
    portalUrl: text("portal_url"),

    /** ISO 3166-1 alpha-2 of the receiving authority's country. */
    receivingCountryCode: text("receiving_country_code"),

    /** Lifecycle state. */
    status: text("status", { enum: REPORT_STATUS_VALUES })
      .notNull()
      .default("draft"),

    /**
     * Tenant scoping. Loose like incidentId — consumers wire to their
     * own tenant/company concept. Required so multi-tenant consumers
     * cannot accidentally cross-read.
     */
    tenantId: text("tenant_id").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_incident_notification_report_incident").on(table.incidentId),
    index("idx_incident_notification_report_tenant").on(table.tenantId),
    index("idx_incident_notification_report_status").on(table.status),
    index("idx_incident_notification_report_submitted").on(table.submittedAt),
  ],
);

export const incidentNotificationValue = pgTable(
  "incident_notification_value",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    reportId: uuid("report_id")
      .notNull()
      .references(() => incidentNotificationReport.id, {
        onDelete: "cascade",
      }),

    /**
     * Matches the `id` of a field definition in the static spec
     * (e.g. "suspectedUnlawfulOrMalicious", "hasCrossBorderImpact",
     * "indicatorsOfCompromise"). Stored as text rather than enum
     * because the field set evolves with schema versions.
     */
    fieldId: text("field_id").notNull(),

    /**
     * The submitted value. JSONB to accommodate all field types
     * (string, text, boolean, number, array of strings, datetime
     * as ISO-8601 string). Validate against the field's `type` at
     * write time via the helpers in `../validate.ts`.
     */
    value: jsonb("value"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uniq_incident_notification_value_report_field").on(
      table.reportId,
      table.fieldId,
    ),
    index("idx_incident_notification_value_field").on(table.fieldId),
  ],
);

export type IncidentNotificationReport =
  typeof incidentNotificationReport.$inferSelect;
export type NewIncidentNotificationReport =
  typeof incidentNotificationReport.$inferInsert;

export type IncidentNotificationValue =
  typeof incidentNotificationValue.$inferSelect;
export type NewIncidentNotificationValue =
  typeof incidentNotificationValue.$inferInsert;
