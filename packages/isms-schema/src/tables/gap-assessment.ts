/**
 * Gap Assessment — NIS2 readiness self-assessment
 *
 * One row per assessment attempt. Users can take it multiple times
 * to track progress over time. Answers and scores stored as JSONB
 * for simplicity (no join table needed).
 *
 * answers: { "gap-0-01": 2, "gap-0-02": -1, ... } where -1=N/A, 0=No, 1=Partially, 2=Yes
 * scores: computed on completion, cached for fast results page loading
 *
 * References: users, companies
 */
import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";
import type { AssessmentScores } from "@/lib/gap-assessment/schema";

export const gapAssessment = pgTable(
  "gap_assessment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id)
      .notNull(),
    companyId: uuid("company_id").references(() => company.id),
    answers: jsonb("answers").$type<Record<string, number>>().notNull().default({}),
    scores: jsonb("scores").$type<AssessmentScores>(),
    completedAt: timestamp("completed_at"),
    shareToken: uuid("share_token"),
    sharePasswordHash: text("share_password_hash"),
    sharedAt: timestamp("shared_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_gap_assessment_user").on(table.userId),
    index("idx_gap_assessment_company").on(table.companyId),
    uniqueIndex("idx_gap_assessment_share_token").on(table.shareToken),
  ],
);
