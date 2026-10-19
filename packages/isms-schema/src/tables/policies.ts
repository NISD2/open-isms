/**
 * Policies — Generated or uploaded policy documents
 *
 * Workflow: draft → review → approved → archived
 * Certain policies (e.g., InfoSec policy) require Geschäftsführer sign-off.
 *
 * References: companies (owner), requirements (which requirement it fulfills), users (approver)
 */

import { requirement } from "@nisd2/grc-data-model/schema";
import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";

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
  ],
);

/**
 * What management approved, one row per approval, kept when the policy is edited afterwards: an
 * edit turns the policy back into a draft and clears its approval, and this row is then the only
 * place the approved text survives. Written in the approval's transaction and never updated.
 * Deleted only with its policy or its company.
 */
export const policyVersion = pgTable(
  "policy_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id")
      .references(() => policy.id, { onDelete: "cascade" })
      .notNull(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    /** sha256 of `content`, so a copy handed to an auditor can be matched to this row. */
    contentSha256: varchar("content_sha256", { length: 64 }).notNull(),
    /** The approver's account; null once that account is deleted, the role and date remain. */
    approvedBy: uuid("approved_by").references(() => user.id, { onDelete: "set null" }),
    approverRole: varchar("approver_role", { length: 255 }).notNull(),
    /** The approval day, which is also the policy's version and its start of validity. */
    approvedOn: date("approved_on").notNull(),
    approvedAt: timestamp("approved_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_policy_version_policy").on(table.policyId),
    index("idx_policy_version_company").on(table.companyId),
    unique("uq_policy_version_approval").on(table.policyId, table.approvedAt),
    check("policy_version_sha256_hex", sql`${table.contentSha256} ~ '^[0-9a-f]{64}$'`),
    check("policy_version_content_present", sql`length(${table.content}) > 0`),
  ],
);
