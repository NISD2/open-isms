/**
 * Audit — Internal audit scheduling, execution, and findings
 *
 * Tracks the full audit lifecycle: planning, execution,
 * findings, and corrective action follow-up.
 *
 * Supports: 7.1 (Internal Audit Schedule), 7.2 (Internal Audit Execution)
 * References: companies, users
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";
import { auditStatusEnum, findingSeverityEnum, findingStatusEnum } from "../enums";

// ---------------------------------------------------------------------------
// Internal Audit — Scheduled audit engagements
// ---------------------------------------------------------------------------

export const internalAudit = pgTable(
  "internal_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    title: varchar("title", { length: 500 }).notNull(),
    auditArea: varchar("audit_area", { length: 255 }).notNull(),
    scope: text("scope"),
    status: auditStatusEnum("status").notNull().default("planned"),

    scheduledDate: date("scheduled_date").notNull(),
    completedAt: timestamp("completed_at"),
    auditorName: varchar("auditor_name", { length: 255 }),
    reportFileKey: varchar("report_file_key", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_internal_audit_company").on(table.companyId),
    index("idx_internal_audit_status").on(table.status),
  ]
);

// ---------------------------------------------------------------------------
// Audit Finding — Individual non-conformities from an audit
// ---------------------------------------------------------------------------

export const auditFinding = pgTable(
  "audit_finding",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditId: uuid("audit_id")
      .references(() => internalAudit.id)
      .notNull(),

    description: text("description").notNull(),
    severity: findingSeverityEnum("severity").notNull(),
    rootCause: text("root_cause"),
    correctiveAction: text("corrective_action").notNull(),

    assignedTo: uuid("assigned_to").references(() => user.id),
    deadline: date("deadline"),
    status: findingStatusEnum("status").notNull().default("open"),

    resolvedAt: timestamp("resolved_at"),
    verifiedBy: uuid("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_finding_audit").on(table.auditId),
    index("idx_audit_finding_status").on(table.status),
  ]
);
