/**
 * Training — Employee and management training records
 *
 * Domain 08: Cyber hygiene and training (8.1 through 8.12)
 * Key: §38(3) BSIG mandates that management attend cybersecurity training
 * "regelmäßig" — the statute names no interval, so never claim one.
 *
 * References: companies, users
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";

export const trainingRecord = pgTable(
  "training_record",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    userId: uuid("user_id").references(() => user.id),

    // Training details
    trainingType: varchar("training_type", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),

    // Participant
    participantName: varchar("participant_name", { length: 255 }).notNull(),
    participantRole: varchar("participant_role", { length: 255 }),
    isManagement: boolean("is_management").default(false),

    // Provider
    providerName: varchar("provider_name", { length: 255 }),
    trainerName: varchar("trainer_name", { length: 255 }),
    trainerQualification: varchar("trainer_qualification", { length: 500 }),

    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    durationMinutes: integer("duration_minutes"),

    // Content
    topicsCovered: text("topics_covered").array().default(sql`'{}'::text[]`),

    // Certification
    certificateFileKey: varchar("certificate_file_key", { length: 500 }),
    // Where the training provider keeps its own record (an e-learning platform's completion
    // report), for staff trained outside the company: the proof stays with the provider. Shown
    // as a link, so the database itself takes only web addresses (chk_training_source_url).
    sourceUrl: varchar("source_url", { length: 2048 }),
    nextTrainingDue: date("next_training_due"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_training_company").on(table.companyId),
    index("idx_training_user").on(table.userId),
    index("idx_training_management").on(table.isManagement),
    check(
      "chk_training_source_url",
      sql`${table.sourceUrl} IS NULL OR ${table.sourceUrl} ILIKE 'https://%' OR ${table.sourceUrl} ILIKE 'http://%'`,
    ),
  ],
);
