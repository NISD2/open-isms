/**
 * Company membership — which companies a person belongs to, and their role in each.
 *
 * Replaces the single `user.companyId` plus `user.role` pair, which allowed one company per login.
 * `user.companyId` stays as the company the person currently has open, so every existing tenant
 * filter keeps working; switching company rewrites it only after a row here says they belong.
 */

import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { membershipRoleEnum } from "../enums";
import { company, user } from "./organization";

export const companyMembership = pgTable(
  "company_membership",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.companyId] }),
    index("idx_company_membership_company").on(table.companyId),
  ],
);
