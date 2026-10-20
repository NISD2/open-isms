/**
 * Close CRM sync: one row per user the close-sync cron (lib/crm/sync.ts) has
 * linked to Close or tried to.
 *
 * - Linked: the lead and contact the user sits on in Close, and the fingerprint
 *   of the field values last written there. A different fingerprint on a later
 *   run (a fact changed, or a field was added) means the lead is updated.
 * - Refused: Close turned the user down (a 4xx about the data). The run carries
 *   on with everyone else; after five refusals the user is left alone until
 *   someone resets rejected_count.
 * - Erased: user_id is null. Deleting the user sets it null instead of deleting
 *   the row, so the next run still knows which Close contact or lead to delete,
 *   and deletes the row once Close has. The row holds only Close's ids, never a
 *   name or an address.
 *
 * Kept out of the `user` table because the user table lives in the open-source
 * isms-schema package and Close is a choice of nisd2.eu, not of the schema.
 */
import { user } from "@nisd2/isms-schema/tables/organization";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const closeCrmSync = pgTable(
  "close_crm_sync",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    leadId: varchar("lead_id", { length: 64 }),
    contactId: varchar("contact_id", { length: 64 }),
    /** The sync created this lead, so an erasure deletes the lead; otherwise only the contact. */
    createdLead: boolean("created_lead").default(false).notNull(),
    /** sha256 of the field values last written to the lead. */
    fieldsHash: varchar("fields_hash", { length: 64 }),
    syncedAt: timestamp("synced_at"),
    rejectedCount: smallint("rejected_count").default(0).notNull(),
    /** HTTP status and the names of the refused fields, never their values. */
    lastError: varchar("last_error", { length: 200 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    check(
      "close_crm_sync_synced_is_linked",
      sql`${t.syncedAt} IS NULL OR (${t.leadId} IS NOT NULL AND ${t.contactId} IS NOT NULL AND ${t.fieldsHash} IS NOT NULL)`,
    ),
    check("close_crm_sync_rejected_count_check", sql`${t.rejectedCount} >= 0`),
  ],
);

/**
 * Platform mail that sales wants on a person's timeline in Close (the allowlist is
 * lib/crm/mail-notes.ts). sendMail adds a row when a send went out; the close-sync
 * writes one note per row and sets logged_at. A row holds the user, the message type
 * and the time, never an address, subject or body. Deleting the user deletes the rows.
 * The note in Close is one fixed sentence per type with no name or address, so a lead
 * the erasure keeps (sales put others on it) holds nothing about the erased person.
 */
export const closeMailLog = pgTable(
  "close_mail_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** An id from lib/mail/email-types.ts. */
    emailType: varchar("email_type", { length: 64 }).notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    /** Null until the note is in Close (or Close refused it for good). */
    loggedAt: timestamp("logged_at"),
  },
  (t) => [
    index("close_mail_log_unlogged_idx").on(t.sentAt).where(sql`${t.loggedAt} IS NULL`),
  ],
);
