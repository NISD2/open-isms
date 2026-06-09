/**
 * Requirement Assignment — Per-requirement user assignment + sign-off tracking
 *
 * Core principle: assignment = sign-off responsibility.
 * An assignment row without signedOffAt is a pending task.
 * An assignment row with signedOffAt is a completed sign-off.
 * When all assignments for a requirement have signedOffAt → requirement complete.
 * When no assignments exist → current behavior (category owner can sign off).
 */
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { companyRequirementStatus } from "./assessments";
import { user } from "./organization";

export const requirementAssignment = pgTable(
  "requirement_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    statusId: uuid("status_id")
      .references(() => companyRequirementStatus.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => user.id)
      .notNull(),
    assignedBy: uuid("assigned_by").references(() => user.id),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    signedOffAt: timestamp("signed_off_at"),
    signedOffRole: varchar("signed_off_role", { length: 255 }),
  },
  (table) => [
    uniqueIndex("uq_req_assign").on(table.statusId, table.userId),
    index("idx_req_assign_user").on(table.userId),
  ]
);
