/**
 * Email opt-outs — one row per thing a person switched off.
 *
 * Absence of a row means subscribed. That is deliberate: the default for
 * optional mail is on, so the table only ever grows by an explicit act of the
 * recipient, and reading it can never accidentally suppress mail that nobody
 * asked to suppress. It also keeps the shape honest — a row IS the consent
 * withdrawal, with the timestamp that proves when it happened, rather than a
 * boolean column whose history is gone the moment it flips back.
 *
 * `scope` is one of:
 *   "all"                        every optional message
 *   "category:<category>"        e.g. "category:reminders"
 *   "type:<email type id>"       e.g. "type:product.lifecycle_nudge"
 * The vocabulary lives in lib/mail/email-types.ts; this table stores it as
 * text so retiring an email type leaves old rows inert rather than dangling.
 * Essential mail (sign-in codes, security notices) is never gated, so a row
 * naming one has no effect — see the consent gate in lib/mail/consent.ts.
 *
 * The legacy `user.emailFollowupsDisabled` boolean still works and still
 * means "all optional mail off"; the gate honours both. It is what the RFC
 * 8058 one-click header has always flipped, so it stays as the coarse switch.
 */
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./organization";

export const emailPreference = pgTable(
  "email_preference",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    /** "all" | "category:<category>" | "type:<email type id>" */
    scope: varchar("scope", { length: 100 }).notNull(),
    /** How the opt-out was made: "one_click", "preference_centre", "admin". */
    source: varchar("source", { length: 40 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_email_preference_user").on(table.userId),
    // Re-clicking an unsubscribe link must be a no-op, not a second row.
    uniqueIndex("uq_email_preference_user_scope").on(table.userId, table.scope),
  ],
);
