import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * A firm requests can be passed to.
 *
 * This is data and not a code constant, for two independent reasons.
 *
 * This repository is public and AGPL. A hard-coded list of partner names in
 * `lib/` announces who our referral partners are to anyone who clones it, and
 * git history is permanent, so the announcement cannot be taken back. None of
 * these firms agreed to be named in public source code, and whose leads go
 * where is commercial information that belongs in the operator's database
 * rather than in the distribution.
 *
 * And a self-hoster's partners are not ours. A deployment in another country
 * has its own firms, and a list in code would make adding one a pull request
 * against somebody else's project.
 *
 * Kept deliberately thin. Coverage areas, prices per lead and contacts are not
 * here, because nothing yet needs to choose a firm automatically. When
 * something does, this is the table that grows.
 */
export const advisoryPartner = pgTable(
  "advisory_partner",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Stable key used by `advisory_referral.partner`. */
    slug: varchar("slug", { length: 60 }).notNull().unique(),
    /** What a human calls them. */
    name: varchar("name", { length: 200 }).notNull(),

    /**
     * Deactivated rather than deleted, so a firm that stops taking referrals
     * disappears from the picker while every referral already recorded against
     * them keeps its meaning.
     */
    active: boolean("active").notNull().default(true),

    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_advisory_partner_active").on(table.active)],
);
