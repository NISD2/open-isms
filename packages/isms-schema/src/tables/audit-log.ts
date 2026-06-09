/**
 * Audit Log — Tamper-evident trail of all compliance-relevant actions
 *
 * Required by NIS2 for accountability. Append-only by design.
 * Each entry stores before/after snapshots as JSONB (the one legitimate JSONB use case).
 *
 * References: companies, users
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => company.id),
    userId: uuid("user_id").references(() => user.id),

    // What happened
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),

    // Details
    description: text("description").notNull(),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    // Tamper detection
    checksum: varchar("checksum", { length: 64 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_company").on(table.companyId),
    index("idx_audit_entity").on(table.entityType, table.entityId),
    index("idx_audit_created").on(table.createdAt),
  ]
);
