import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { leadIntentEnum } from "../enums";

export const lead = pgTable(
  "lead",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    companyName: varchar("company_name", { length: 500 }),
    classification: varchar("classification", { length: 50 }),
    source: varchar("source", { length: 100 }).notNull().default("applicability_check"),
    /**
     * Onboarding intent declared at /applicability:
     *   entity   — wants to use the NIS2 compliance side
     *   supplier — wants to publish a supplier portal profile
     *   both     — Systemhaus (both sides at once)
     *   unknown  — has not yet declared
     * Drives which onboarding flow runs after signup.
     */
    intent: leadIntentEnum("intent").default("unknown").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_lead_email").on(table.email),
    index("idx_lead_created").on(table.createdAt),
    index("idx_lead_intent").on(table.intent),
  ],
);
