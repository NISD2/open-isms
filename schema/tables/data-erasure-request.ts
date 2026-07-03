/**
 * Data Erasure Request — an inbound "please delete my data" signal, captured
 * before any deletion happens.
 *
 * This is NOT the erasure itself (that stays admin-only via platformAdmin.
 * eraseUser + data_erasure_log). This table records that a person ASKED, keeps
 * their optional feedback ("what were you looking for / why are you leaving"),
 * and lets a human follow up and then action it with the existing Erase tool.
 *
 * Deliberately NOT foreign-keyed to `user`, exactly like `data_erasure_log`
 * and `email_otp`:
 *  - a request must survive the very erasure it triggered — after the account
 *    is deleted, this row (and its feedback) remains as the record of the ask;
 *  - a NO ACTION FK would block that erasure. So `subjectUserId` is a plain
 *    uuid with no FK, and `email` is denormalised as the durable identifier.
 *
 * `verified` = true when the request arrived via a valid signed follow-up link
 * or from a logged-in session (the identity is established). `verified` = false
 * for the anonymous public path, where a human must confirm the requester owns
 * the address before erasing anything.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const dataErasureRequest = pgTable(
  "data_erasure_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Denormalised requester email — the durable identifier, survives erasure. */
    email: varchar("email", { length: 320 }).notNull(),
    /** The matched account id, if one existed at request time. Plain uuid, NO
     *  FK — must outlive the deleted user and never block the erasure. Null when
     *  the address matched no account. */
    subjectUserId: uuid("subject_user_id"),
    /** Optional exit feedback. The whole point: turn an exit into a signal. */
    feedback: text("feedback"),
    /** How the request arrived: 'followup_link' | 'self' | 'public'. App-validated. */
    source: varchar("source", { length: 20 }).notNull(),
    /** True when identity was established (valid signed link or logged-in session). */
    verified: boolean("verified").notNull().default(false),
    /** Handling state: 'pending' | 'completed' | 'dismissed'. App-validated. */
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    /** Platform admin who handled the request (plain uuid, no FK). */
    completedBy: uuid("completed_by"),
  },
  (table) => [
    index("idx_data_erasure_request_status").on(table.status),
    index("idx_data_erasure_request_email").on(table.email),
  ],
);
