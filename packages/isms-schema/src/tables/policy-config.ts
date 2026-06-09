/**
 * Policy Config — Company-level structured policy configuration
 *
 * Stores typed JSONB config for structured policy editors (crypto, access control,
 * procurement, secure dev). One row per (company, policyType).
 * Pre-seeded with BSI/CIR defaults. Editors live in components/compliance/.
 */
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { company } from "./organization";

export const companyPolicyConfig = pgTable(
  "company_policy_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    policyType: varchar("policy_type", { length: 50 }).notNull(),
    config: jsonb("config").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_policy_config_company_type").on(
      table.companyId,
      table.policyType,
    ),
  ],
);
