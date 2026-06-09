/**
 * Improvement — Continuous improvement tracking
 *
 * Collects improvement items from all sources: audits, incidents,
 * pentests, management reviews, KPI breaches, and regulatory changes.
 *
 * Supports: 7.10 (Continuous Improvement Log)
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
import { priorityEnum } from "@nisd2/grc-data-model/enums";
import { improvementSourceEnum, findingStatusEnum } from "../enums";

export const improvementItem = pgTable(
  "improvement_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    source: improvementSourceEnum("source").notNull(),
    sourceReferenceId: uuid("source_reference_id"), // Polymorphic FK to audit, incident, etc.
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),

    assignedTo: uuid("assigned_to").references(() => user.id),
    priority: priorityEnum("priority").notNull(),
    targetDate: date("target_date"),
    status: findingStatusEnum("status").notNull().default("open"),

    deferralReason: text("deferral_reason"),
    completedAt: timestamp("completed_at"),
    verificationNotes: text("verification_notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_improvement_item_company").on(table.companyId),
    index("idx_improvement_item_status").on(table.status),
    index("idx_improvement_item_source").on(table.source),
  ]
);
