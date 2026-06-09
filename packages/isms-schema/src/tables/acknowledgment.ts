/**
 * Acknowledgment — Employee policy acknowledgments
 *
 * Tracks which employees have signed/acknowledged which policies
 * and which version. One record per user per policy version.
 *
 * Supports: 8.8 (Acceptable Use Policy), 10.1 (Access Control Policy)
 * References: policies, users
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./organization";
import { policy } from "./policies";

export const policyAcknowledgment = pgTable(
  "policy_acknowledgment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id")
      .references(() => policy.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => user.id)
      .notNull(),

    acknowledgedAt: timestamp("acknowledged_at").notNull(),
    acknowledgedVersion: integer("acknowledged_version"),
    method: varchar("method", { length: 100 }), // signed_form, digital_acceptance

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_policy_ack_policy").on(table.policyId),
    index("idx_policy_ack_user").on(table.userId),
  ]
);
