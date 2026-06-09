/**
 * Training — Employee and management training records
 *
 * Domain 08: Cyber hygiene and training (8.1 through 8.12)
 * Key: §38(3) BSIG mandates management cybersecurity training every 3 years.
 *
 * References: companies, users
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
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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
    topicsCovered: text("topics_covered")
      .array()
      .default(sql`'{}'::text[]`),

    // Certification
    certificateFileKey: varchar("certificate_file_key", { length: 500 }),
    nextTrainingDue: date("next_training_due"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_training_company").on(table.companyId),
    index("idx_training_user").on(table.userId),
    index("idx_training_management").on(table.isManagement),
  ]
);
