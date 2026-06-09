/**
 * Change Management — IT/OT change request tracking
 *
 * Tracks all changes to in-scope systems with security impact assessment,
 * approval workflow, implementation, and verification.
 *
 * Supports: 6.8, 6.9 (Change Management Process & Log)
 * References: companies, users, assets
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";
import { asset } from "@nisd2/grc-data-model/schema";
import { changeTypeEnum, changeStatusEnum } from "../enums";

export const changeRequest = pgTable(
  "change_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    // Change details
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),
    businessJustification: text("business_justification"),
    securityImpactAssessment: text("security_impact_assessment"),
    changeType: changeTypeEnum("change_type").notNull(),
    status: changeStatusEnum("status").notNull().default("draft"),

    // Affected system
    assetId: uuid("asset_id").references(() => asset.id),

    // Workflow
    requestedBy: uuid("requested_by").references(() => user.id),
    approvedBy: uuid("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    implementedBy: uuid("implemented_by").references(() => user.id),
    implementedAt: timestamp("implemented_at"),
    testedAt: timestamp("tested_at"),
    rollbackPlan: text("rollback_plan"),
    rolledBackAt: timestamp("rolled_back_at"),
    closedAt: timestamp("closed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_change_request_company").on(table.companyId),
    index("idx_change_request_status").on(table.status),
  ]
);
