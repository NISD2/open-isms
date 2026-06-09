/**
 * Assessments — A company's compliance journey
 *
 * An assessment is a snapshot of one company working through one framework.
 * Each requirement gets a status row tracking progress, sign-offs, and review dates.
 *
 * References: companies, complianceFrameworks, requirements, users
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  decimal,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import { itemStatusEnum } from "../enums";
import { company, user } from "./organization";
import { complianceFramework } from "@nisd2/grc-data-model/schema";
import { requirement } from "@nisd2/grc-data-model/schema";

/** Shape of the sign-off snapshot captured when a user signs off a requirement */
export interface SignOffSnapshot {
  templateVersion: number;
  derivedData?: Record<string, unknown>;
  companyProfile?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Company Assessments — One row per company × framework journey
// ---------------------------------------------------------------------------

export const companyAssessment = pgTable(
  "company_assessment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    frameworkId: uuid("framework_id")
      .references(() => complianceFramework.id)
      .notNull(),

    // Timeline
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),

    // Progress
    currentStep: integer("current_step").default(1),
    totalRequirements: integer("total_requirements").default(0),
    completedRequirements: integer("completed_requirements").default(0),
    compliancePercentage: decimal("compliance_percentage", {
      precision: 5,
      scale: 2,
    }).default("0"),

    // Snapshot
    entityTypeAtAssessment: entityTypeEnum("entity_type_at_assessment"),

    // Re-assessment scheduling (framework-level reminder)
    nextReassessmentDate: date("next_reassessment_date"),
    lastReassessedAt: timestamp("last_reassessed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_assessment_company").on(table.companyId),
    index("idx_assessment_framework").on(table.frameworkId),
  ]
);

// ---------------------------------------------------------------------------
// Requirement Status — Per-requirement checklist state within an assessment
// ---------------------------------------------------------------------------

export const companyRequirementStatus = pgTable(
  "company_requirement_status",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .references(() => companyAssessment.id)
      .notNull(),
    requirementId: uuid("requirement_id")
      .references(() => requirement.id)
      .notNull(),

    // Status
    status: itemStatusEnum("status").default("not_started").notNull(),
    isApplicable: boolean("is_applicable").default(true),
    notApplicableReason: text("not_applicable_reason"),

    // Completion
    completedAt: timestamp("completed_at"),
    completedBy: uuid("completed_by").references(() => user.id),

    // Sign-off
    signedOffBy: uuid("signed_off_by").references(() => user.id),
    signedOffAt: timestamp("signed_off_at"),
    signedOffRole: varchar("signed_off_role", { length: 255 }),
    signedOffTemplateVersion: integer("signed_off_template_version"),

    // Review scheduling
    nextReviewDate: date("next_review_date"),
    lastReviewedAt: timestamp("last_reviewed_at"),

    // Review (by our legal team)
    reviewedBy: uuid("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewFeedback: text("review_feedback"),

    // Assignment
    assignedTo: uuid("assigned_to").references(() => user.id),

    // Internal notes
    internalNotes: text("internal_notes"),

    // Sign-off snapshot — captures derived operational data at sign-off time
    signOffSnapshot: jsonb("sign_off_snapshot").$type<SignOffSnapshot>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_req_status_assessment").on(table.assessmentId),
    index("idx_req_status_requirement").on(table.requirementId),
    uniqueIndex("idx_req_status_unique").on(
      table.assessmentId,
      table.requirementId
    ),
    index("idx_req_status_next_review").on(table.nextReviewDate),
  ]
);
