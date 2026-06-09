/**
 * Policies — Generated or uploaded policy documents
 *
 * Workflow: draft → review → approved → archived
 * Certain policies (e.g., InfoSec policy) require Geschäftsführer sign-off.
 *
 * References: companies (owner), requirements (which requirement it fulfills), users (approver)
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
import { requirement } from "@nisd2/grc-data-model/schema";

export const policy = pgTable(
  "policy",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    requirementId: uuid("requirement_id").references(() => requirement.id),

    // Policy details
    title: varchar("title", { length: 500 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    version: varchar("version", { length: 20 }).notNull().default("1.0"),
    content: text("content"),
    fileKey: varchar("file_key", { length: 500 }),

    // Approval
    status: varchar("status", { length: 50 }).default("draft").notNull(),
    approvedBy: uuid("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    approverRole: varchar("approver_role", { length: 255 }),

    // Validity
    effectiveFrom: date("effective_from"),
    reviewDue: date("review_due"),
    archivedAt: timestamp("archived_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_policy_company").on(table.companyId),
    index("idx_policy_requirement").on(table.requirementId),
    index("idx_policy_status").on(table.status),
  ]
);
