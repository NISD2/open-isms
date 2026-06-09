/**
 * Review — Management review meetings
 *
 * Tracks quarterly/annual management oversight meetings,
 * attendees, decisions, and action items.
 *
 * Supports: 1.2 (Management Oversight), 7.5 (Management Review)
 * References: companies
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
import { sql } from "drizzle-orm";
import { company } from "./organization";

export const managementReview = pgTable(
  "management_review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    title: varchar("title", { length: 500 }).notNull(),
    reviewDate: date("review_date").notNull(),
    attendees: text("attendees").array().default(sql`'{}'::text[]`),
    topicsCovered: text("topics_covered").array().default(sql`'{}'::text[]`),

    decisions: text("decisions"),
    actionItems: text("action_items"),
    minutesFileKey: varchar("minutes_file_key", { length: 500 }),
    nextReviewDate: date("next_review_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_management_review_company").on(table.companyId),
    index("idx_management_review_date").on(table.reviewDate),
  ]
);
