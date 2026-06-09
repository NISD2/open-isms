/**
 * Exercise — Incident response & business continuity drills
 *
 * Tracks tabletop exercises, technical simulations, and full-scale tests.
 * Captures scenarios, participants, gaps identified, and lessons learned.
 *
 * Supports: 3.10 (Incident Drills), 4.10 (BCP Tabletop), 4.11 (Full-Scale Test)
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
import { exerciseTypeEnum } from "../enums";

export const exercise = pgTable(
  "exercise",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    title: varchar("title", { length: 500 }).notNull(),
    exerciseType: exerciseTypeEnum("exercise_type").notNull(),
    domain: varchar("domain", { length: 100 }).notNull(), // incident_response, business_continuity, crisis_management

    scheduledDate: date("scheduled_date").notNull(),
    completedAt: timestamp("completed_at"),
    scenarioDescription: text("scenario_description"),
    participants: text("participants").array().default(sql`'{}'::text[]`),
    facilitator: varchar("facilitator", { length: 255 }),

    identifiedGaps: text("identified_gaps").array().default(sql`'{}'::text[]`),
    lessonsLearned: text("lessons_learned"),
    afterActionReportFileKey: varchar("after_action_report_file_key", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_exercise_company").on(table.companyId),
    index("idx_exercise_type").on(table.exerciseType),
    index("idx_exercise_domain").on(table.domain),
  ]
);
