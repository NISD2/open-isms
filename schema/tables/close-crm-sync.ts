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
 * Replaced by close_resend_log below and no longer read or written. It stays defined
 * because the release still serving during a deploy inserts into it; dropping it is
 * the next release's migration.
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

/**
 * Every Resend email the mail poll (lib/crm/mail-poll.ts) has dealt with, one row per
 * email, so the poll knows where it stopped last time: it walks Resend's list from the
 * newest mail and stops at the second mail that has a row here. A row holds Resend's
 * email id, when it was sent, what became of it and how many notes it produced, never
 * an address, subject or body.
 *
 * - noted: at least one recipient has the note on their contact in Close.
 * - skipped_not_listed: not mail sales should see (lib/crm/mail-rules.ts).
 * - skipped_not_delivered: bounced, suppressed or failed, so the person never got it.
 * - skipped_no_contact: listed, but no recipient is a contact in Close.
 */
export const closeResendLog = pgTable(
  "close_resend_log",
  {
    resendId: varchar("resend_id", { length: 64 }).primaryKey(),
    sentAt: timestamp("sent_at").notNull(),
    outcome: varchar("outcome", { length: 24 }).notNull(),
    notes: smallint("notes").default(0).notNull(),
    loggedAt: timestamp("logged_at").defaultNow().notNull(),
  },
  (t) => [
    check(
      "close_resend_log_outcome_check",
      sql`${t.outcome} IN ('noted', 'skipped_not_listed', 'skipped_not_delivered', 'skipped_no_contact')`,
    ),
    check(
      "close_resend_log_noted_has_notes",
      sql`(${t.outcome} = 'noted') = (${t.notes} > 0)`,
    ),
  ],
);
