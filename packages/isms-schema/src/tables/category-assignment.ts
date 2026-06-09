/**
 * Category Assignment — One owner per category within an assessment
 *
 * Each category has exactly one assigned owner. The unique constraint on
 * (assessmentId, categoryId) enforces this at the DB level.
 */
import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { companyAssessment } from "./assessments";
import { requirementCategory } from "@nisd2/grc-data-model/schema";
import { user } from "./organization";

export const categoryAssignment = pgTable(
  "category_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .references(() => companyAssessment.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => requirementCategory.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => user.id)
      .notNull(),
    assignedBy: uuid("assigned_by")
      .references(() => user.id)
      .notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_category_owner").on(
      table.assessmentId,
      table.categoryId,
    ),
  ]
);
