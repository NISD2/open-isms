/**
 * Notification — Delivery tracking for reminders and alerts
 *
 * Tracks every reminder/notification sent to a user: what triggered it,
 * when it was sent, whether it was acknowledged, and whether it escalated.
 * Framework-agnostic — works for any entity with a deadline or review date.
 *
 * Recipient model: exactly ONE of recipientId (in-portal Sorzel user) or
 * recipientEmail (external CISO with no Sorzel account) MUST be set. The
 * invariant is enforced in tRPC procedures (lib/compliance/resolve-recipients.ts)
 * and in tests. SQL CHECK constraint can be added later if Drizzle 0.38 supports it.
 *
 * companyId always points at the SOURCE company (the supplier whose event this is,
 * or the entity whose deadline this is). It is never the recipient's company.
 * One exception: lifecycle claim rows (entityType "lifecycle_email") are
 * per-USER once-ever dedup records, and for them companyId is merely the
 * recipient's company at claim time. When that company is GDPR-erased while
 * the recipient lives on elsewhere, the claim is re-homed to the recipient's
 * current company (lib/gdpr/erase-user.ts) — deleting it would re-arm a
 * one-shot email; the column is NOT NULL so it cannot be detached instead.
 *
 * References: companies, users
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { notificationChannelEnum, notificationStatusEnum, urgencyEnum } from "../enums";
import { company, user } from "./organization";

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    /**
     * In-portal recipient. Set when the recipient is a Sorzel user.
     * NULL when the recipient is an external CISO identified by recipientEmail.
     * Exactly one of recipientId / recipientEmail must be set.
     */
    recipientId: uuid("recipient_id").references(() => user.id),
    /**
     * External recipient email. Set when the recipient is NOT a Sorzel user
     * (e.g. a CISO subscribed to a supplier's published profile).
     * Exactly one of recipientId / recipientEmail must be set.
     */
    recipientEmail: varchar("recipient_email", { length: 255 }),

    // What triggered this notification
    entityType: varchar("entity_type", { length: 100 }).notNull(), // e.g. "policy", "risk", "bsi_incident_report", "supplier_publication_event"
    entityId: uuid("entity_id").notNull(), // FK to the source row
    triggerField: varchar("trigger_field", { length: 100 }).notNull(), // e.g. "reviewDue", "nextReviewDate", "dueAt"

    // Content
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body"),

    // Delivery
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").default("pending").notNull(),

    // Timeline
    scheduledFor: timestamp("scheduled_for").notNull(),
    sentAt: timestamp("sent_at"),
    acknowledgedAt: timestamp("acknowledged_at"),
    escalatedAt: timestamp("escalated_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Deadline intelligence
    urgency: urgencyEnum("urgency").default("info").notNull(),
    escalationLevel: integer("escalation_level"),
    linkUrl: varchar("link_url", { length: 500 }),
  },
  (table) => [
    index("idx_notification_company").on(table.companyId),
    index("idx_notification_recipient").on(table.recipientId),
    index("idx_notification_recipient_email").on(table.recipientEmail),
    index("idx_notification_status").on(table.status),
    index("idx_notification_scheduled").on(table.scheduledFor),
    index("idx_notification_entity").on(table.entityType, table.entityId),
    // Lifecycle emails (lib/lifecycle) are one-shot per (user, email type):
    // the row doubles as the claim record, inserted BEFORE the send with
    // onConflictDoNothing. This partial unique index is what makes the claim
    // race-proof — two concurrent cron runs cannot both insert, so a user can
    // never receive the same lifecycle email twice. Scoped to the
    // lifecycle_email entityType so the reminder/escalation rows, which
    // legitimately repeat per (recipient, triggerField), are untouched.
    uniqueIndex("uq_notification_lifecycle_once")
      .on(table.recipientId, table.triggerField)
      .where(sql`${table.entityType} = 'lifecycle_email'`),
    // Enforce the XOR invariant at the DB level: exactly one of recipientId
    // (in-portal user) or recipientEmail (external CISO) must be set.
    check(
      "chk_notification_recipient_xor",
      sql`(${table.recipientId} IS NOT NULL) <> (${table.recipientEmail} IS NOT NULL)`,
    ),
  ]
);
