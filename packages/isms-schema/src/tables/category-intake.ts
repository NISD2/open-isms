/**
 * Category Intake — BSI-aligned intake forms per category per assessment
 *
 * One row per category per assessment. Stores draft answers (auto-saved)
 * and final sign-off. Replaces per-requirement forms with curated
 * ~6-10 field forms per BSI §30(2) measure area.
 */
import {
  pgTable,
  uuid,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { companyAssessment } from "./assessments";
import { requirementCategory } from "@nisd2/grc-data-model/schema";
import { user } from "./organization";

export const companyCategoryIntake = pgTable(
  "company_category_intake",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .references(() => companyAssessment.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => requirementCategory.id)
      .notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>>().default({}),
    completionPct: integer("completion_pct").default(0),
    lastSavedBy: uuid("last_saved_by").references(() => user.id),
    lastSavedAt: timestamp("last_saved_at").defaultNow(),
    signedOffBy: uuid("signed_off_by").references(() => user.id),
    signedOffAt: timestamp("signed_off_at"),
    signOffSnapshot: jsonb("sign_off_snapshot").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_intake_assessment_category").on(
      table.assessmentId,
      table.categoryId,
    ),
  ],
);
