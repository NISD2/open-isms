import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { user } from "@nisd2/isms-schema/tables/organization";

/**
 * Newsletter group — a named audience segment for targeted campaigns.
 *
 * Membership is explicit (newsletter_group_member). A send can target one
 * group or "all eligible". Group sends still apply the eligibility gate
 * (not opted out, not disposable, verified) on top of membership, so adding
 * someone to a group never overrides their unsubscribe.
 */
export const newsletterGroup = pgTable(
  "newsletter_group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_newsletter_group_created").on(table.createdAt)],
);

/** Many-to-many: which users belong to which group. */
export const newsletterGroupMember = pgTable(
  "newsletter_group_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .references(() => newsletterGroup.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_newsletter_group_member").on(table.groupId, table.userId),
    index("idx_newsletter_group_member_group").on(table.groupId),
    index("idx_newsletter_group_member_user").on(table.userId),
  ],
);
