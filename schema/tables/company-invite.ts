/**
 * Company Invite — Token-based invite links for adding team members
 *
 * Admin creates an invite (email + token). The invitee opens the link,
 * signs in with Google, and gets linked to the company automatically.
 */
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { company, user } from "@nisd2/isms-schema/tables/organization";

export const companyInvite = pgTable(
  "company_invite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    invitedBy: uuid("invited_by")
      .references(() => user.id)
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    role: varchar("role", { length: 100 }).notNull().default("member"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    acceptedBy: uuid("accepted_by").references(() => user.id),
    acceptedAt: timestamp("accepted_at"),
    redirectPath: varchar("redirect_path", { length: 500 }),
    /** When invite originates from assignment popover: { assessmentId, categoryId, requirementId? } */
    assignmentContext: jsonb("assignment_context"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_invite_company_email").on(table.companyId, table.email),
    index("idx_invite_token").on(table.token),
    index("idx_invite_company").on(table.companyId),
  ]
);
