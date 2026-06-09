/**
 * Risk Methodology — Company-level risk assessment configuration
 *
 * Stores the likelihood/impact scales with user-editable labels and descriptions.
 * Pre-seeded with BSI 200-3 defaults. One methodology per company.
 * Referenced by the risk register for scoring and by compliance req 2.1.
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { company } from "./organization";

export const companyRiskMethodology = pgTable(
  "company_risk_methodology",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull().default("BSI 200-3"),
    likelihoodLevels: jsonb("likelihood_levels").notNull(),
    impactLevels: jsonb("impact_levels").notNull(),
    acceptanceThreshold: integer("acceptance_threshold").notNull().default(4),
    includesOt: boolean("includes_ot").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_risk_methodology_company").on(table.companyId),
  ]
);
