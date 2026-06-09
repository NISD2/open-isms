/**
 * Risks — Risk register and risk-to-asset mapping
 *
 * Foundation for all NIS2 risk-based measures (§30 Abs. 1 BSIG).
 * Each risk is scored (likelihood × impact), treated, and linked to affected assets.
 *
 * References: companies, users (risk acceptance), assets (via riskAsset join)
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { asset } from "./asset";
import { supplier } from "./supplier";

export const risk = pgTable(
  "risk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),

    // Risk details
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }),

    // Scoring
    likelihood: integer("likelihood").notNull(),
    impact: integer("impact").notNull(),
    riskScore: integer("risk_score").notNull(),

    // Treatment
    treatment: varchar("treatment", { length: 50 }).notNull(),
    treatmentDescription: text("treatment_description"),
    residualLikelihood: integer("residual_likelihood"),
    residualImpact: integer("residual_impact"),
    residualRiskScore: integer("residual_risk_score"),

    // Ownership
    riskOwner: varchar("risk_owner", { length: 255 }),

    // Review
    lastReviewedAt: timestamp("last_reviewed_at"),
    nextReviewDate: date("next_review_date"),

    // Sign-off (2.8)
    acceptedBy: uuid("accepted_by"),
    acceptedAt: timestamp("accepted_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_risk_company").on(table.companyId),
    index("idx_risk_score").on(table.riskScore),
  ]
);

export const riskAsset = pgTable(
  "risk_asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id")
      .references(() => risk.id)
      .notNull(),
    assetId: uuid("asset_id")
      .references(() => asset.id)
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_risk_assets_pair").on(table.riskId, table.assetId),
  ]
);

export const riskSupplier = pgTable(
  "risk_supplier",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id")
      .references(() => risk.id)
      .notNull(),
    supplierId: uuid("supplier_id")
      .references(() => supplier.id)
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_risk_supplier_pair").on(table.riskId, table.supplierId),
  ]
);
