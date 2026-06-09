/**
 * Applicability Lookup — Public NIS2 company lookups (no auth)
 *
 * Dual purpose:
 * 1. Track searches (upserted on every free search API call)
 * 2. Cache paid API responses (filled when user clicks a company)
 *
 * companyId is unique — same company looked up twice = 1 paid API call.
 */
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const applicabilityLookup = pgTable(
  "applicability_lookup",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    searchQuery: varchar("search_query", { length: 500 }).notNull(),
    companyId: varchar("company_id", { length: 100 }).notNull(),
    companyName: varchar("company_name", { length: 500 }).notNull(),
    classification: varchar("classification", { length: 50 }),
    apiResponse: jsonb("api_response").$type<Record<string, unknown>>(),
    lookedUpAt: timestamp("looked_up_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_applicability_lookup_company").on(table.companyId),
    index("idx_applicability_lookup_created").on(table.createdAt),
    index("idx_applicability_lookup_classification").on(table.classification),
  ],
);
