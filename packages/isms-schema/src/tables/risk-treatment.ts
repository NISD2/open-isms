/**
 * Risk Treatment — Concrete treatment actions per risk
 *
 * Each risk can have multiple treatment actions, each with
 * its own owner, deadline, and verification status.
 *
 * Supports: 2.5 (Risk Treatment Plan)
 * References: risks, users
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
} from "drizzle-orm/pg-core";
import { user } from "./organization";
import { risk } from "@nisd2/grc-data-model/schema";
import { treatmentStatusEnum } from "../enums";

export const riskTreatment = pgTable(
  "risk_treatment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id")
      .references(() => risk.id)
      .notNull(),

    action: varchar("action", { length: 500 }).notNull(),
    description: text("description"),
    requiredResources: text("required_resources"),

    responsibleUserId: uuid("responsible_user_id").references(() => user.id),
    deadline: date("deadline"),
    status: treatmentStatusEnum("status").notNull().default("not_started"),

    completedAt: timestamp("completed_at"),
    verifiedBy: uuid("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),

    expectedResidualLikelihood: integer("expected_residual_likelihood"),
    expectedResidualImpact: integer("expected_residual_impact"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_risk_treatment_risk").on(table.riskId),
    index("idx_risk_treatment_status").on(table.status),
  ]
);
