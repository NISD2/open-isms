/**
 * Data Erasure Log — durable, exportable record of a GDPR Art. 17 erasure.
 *
 * This table is the ACCOUNTABILITY evidence (GDPR Art. 5(2), Art. 24) that a
 * data-subject erasure request was received and honoured. It is written inside
 * the same transaction as the erasure itself and must NOT be lost when the
 * subject's account is deleted.
 *
 * Deliberately NOT foreign-keyed to `user` or `company`:
 *  - a cascading FK would destroy this record along with the user (the exact
 *    failure to avoid);
 *  - a NO ACTION FK would block the very deletion it documents.
 * We denormalise the subject email/name/id as plain columns instead, exactly
 * like `email_otp` / `lead`, whose rows are also documented to survive user
 * deletion.
 *
 * Data minimisation (Art. 5(1)(c)) + storage limitation (Art. 5(1)(e)):
 *  - `subjectEmail` (raw) is kept for the accountability window then minimised;
 *    `subjectEmailHash` (HMAC) is the permanent, pseudonymous proof that
 *    survives past `retentionUntil` and doubles as a suppression key. It is a
 *    pseudonymous identifier (GDPR Recital 26), not anonymous data.
 *  - `retentionUntil` = erasedAt + 3y (German Regelverjährung, BGB §195).
 *    Minimising the raw email at/after that date is a retention-policy step
 *    (see purgeExpiredErasureRecords in lib/gdpr/erase-user); it is not yet
 *    wired to a cron.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/** How a given table's rows relating to the subject were resolved. */
export interface ErasureScope {
  /** rows hard-deleted, keyed by table name → count */
  deleted: Record<string, number>;
  /** rows whose subject attribution was nulled or reassigned to the tombstone, keyed by table name → count */
  anonymized: Record<string, number>;
  /** human-readable data categories / systems that were cleared (for the certificate) */
  systemsCleared: string[];
  /** external processors that hold copies and are in scope for an Art. 19
   *  instruction-to-delete. This lists recipients; it does not assert that an
   *  automated notification was sent. */
  processorsInScope: string[];
  /** true when the subject was the sole member of a company and that company + all its tenant data were torn down */
  companyTornDown: boolean;
  /** residual caveats worth recording (e.g. JSONB snapshot scrub was best-effort) */
  residualNotes: string[];
}

/** "hard_delete": subject had no retained-evidence footprint, everything was deleted.
 *  "anonymized": some tamper-evident/tenant records were retained with the subject's identity severed. */
export type ErasureMethod = "hard_delete" | "anonymized";

export const dataErasureLog = pgTable(
  "data_erasure_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-facing case reference, e.g. ERASURE-2026-0001. Unique. */
    caseRef: varchar("case_ref", { length: 64 }).notNull().unique(),

    // ── Subject (denormalised, NO FK — must outlive the deleted user) ──────
    /** The deleted user's id. Plain uuid, no FK. */
    subjectUserId: uuid("subject_user_id").notNull(),
    /** Raw email, kept until `retentionUntil` then minimised per retention policy. */
    subjectEmail: varchar("subject_email", { length: 320 }),
    /** HMAC-SHA256 of the lowercased email. Permanent pseudonymous proof + suppression key. */
    subjectEmailHash: varchar("subject_email_hash", { length: 64 }).notNull(),
    subjectName: varchar("subject_name", { length: 255 }),
    /** The subject's company at erasure time (plain uuid, no FK). Null if none. */
    companyId: uuid("company_id"),
    companyName: varchar("company_name", { length: 255 }),

    // ── Request metadata (Art. 12 / Art. 17) ──────────────────────────────
    requestReceivedAt: timestamp("request_received_at"),
    /** e.g. "email". */
    requestChannel: varchar("request_channel", { length: 100 }),
    /** Free text of what the subject invoked, e.g. "erasure / all GDPR rights". */
    rightsInvoked: text("rights_invoked"),
    /** e.g. "GDPR Art. 17(1)(a), 17(1)(b)". */
    legalBasis: varchar("legal_basis", { length: 255 }),

    // ── Execution ─────────────────────────────────────────────────────────
    erasedAt: timestamp("erased_at").defaultNow().notNull(),
    /** Platform admin who executed the erasure (plain uuid, no FK). */
    actorUserId: uuid("actor_user_id"),
    actorEmail: varchar("actor_email", { length: 320 }).notNull(),
    method: varchar("method", { length: 20 }).notNull(),
    companyTornDown: boolean("company_torn_down").notNull().default(false),

    /** Structured account of what was deleted vs anonymised, per table + systems/processors. */
    scope: jsonb("scope").$type<ErasureScope>().notNull(),
    notes: text("notes"),

    // ── Retention of THIS record (Art. 5(1)(e)) ───────────────────────────
    retentionUntil: timestamp("retention_until").notNull(),

    // ── Tamper-evidence: per-row SHA-256 over the canonical record ────────
    checksum: varchar("checksum", { length: 64 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_data_erasure_log_email_hash").on(table.subjectEmailHash),
    index("idx_data_erasure_log_erased_at").on(table.erasedAt),
    index("idx_data_erasure_log_subject_user").on(table.subjectUserId),
  ],
);
