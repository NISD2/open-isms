/**
 * Billing — our references to documents that Qonto issues.
 *
 * Qonto is the source of truth for every invoice and credit note. These tables hold only what can
 * never change once a document is issued (number, amount, dates) plus the reference back to Qonto.
 * Anything that changes, such as whether an invoice is paid or canceled, is read from Qonto and
 * never stored here, so there is no second copy that could disagree with the first.
 *
 * Rows are never deleted: an issued invoice must be kept for eight years (§ 14b UStG), so every
 * foreign key into a billing document restricts deletion instead of cascading.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { documentSeriesEnum, invoiceSourceEnum, vatTreatmentEnum } from "../enums";
import { billingAccount, user } from "./organization";

export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    billingAccountId: uuid("billing_account_id")
      .notNull()
      .references(() => billingAccount.id, { onDelete: "restrict" }),
    qontoInvoiceId: varchar("qonto_invoice_id", { length: 64 }).notNull().unique(),
    /** Ours to assign, because Qonto's automatic numbering is off; what the payer types in. */
    number: varchar("number", { length: 40 }).notNull().unique(),
    netCents: integer("net_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
    /** Why the VAT is what it is. Fixed at issue, and the first thing an auditor asks about. */
    vatTreatment: vatTreatmentEnum("vat_treatment").notNull(),
    /**
     * The Commission's consultation number for the VIES check behind this invoice, when there was
     * one. It is the evidence that justifies reverse charge, so it is kept with the invoice it
     * justifies. Null when the check was not possible or not needed.
     */
    viesRequestIdentifier: varchar("vies_request_identifier", { length: 64 }),
    issueDate: date("issue_date").notNull(),
    /** The paid year. Cancellation inside thirty days is counted from `issueDate`. */
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    source: invoiceSourceEnum("source").notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    /** Where our own copy of the PDF is kept. Null until it has been archived. */
    archivedPdfKey: varchar("archived_pdf_key", { length: 512 }),
    /**
     * The AGB and AVV this order was made under: their version (lib/billing/terms.ts), when
     * they were accepted, and by whom. On the order page the person who ticked the box; on a close
     * from platform admin (`source` = admin) the customer, who accepted on the call and whom the
     * admin recorded. Null on invoices issued before acceptance was recorded, and on a close where
     * the admin did not record it.
     */
    termsVersion: varchar("terms_version", { length: 10 }),
    termsAcceptedAt: timestamp("terms_accepted_at"),
    termsAcceptedByUserId: uuid("terms_accepted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_invoice_billing_account").on(table.billingAccountId),
    // A version was accepted exactly when there is a time, and a person is named only for an
    // acceptance. The person may later be deleted, so the version and the time can stand alone.
    check(
      "invoice_terms_version_with_time",
      sql`(${table.termsVersion} IS NULL) = (${table.termsAcceptedAt} IS NULL)`,
    ),
    check(
      "invoice_terms_by_only_if_accepted",
      sql`${table.termsAcceptedByUserId} IS NULL OR ${table.termsAcceptedAt} IS NOT NULL`,
    ),
    // The VAT facts cannot contradict each other: only German VAT carries tax, and no amount is
    // negative. The row is kept for eight years, so it has to be right when it is written.
    check("invoice_net_positive", sql`${table.netCents} > 0`),
    check("invoice_vat_not_negative", sql`${table.vatCents} >= 0`),
    check(
      "invoice_vat_matches_treatment",
      sql`${table.vatTreatment} IN ('domestic', 'unconfirmed_eu') OR ${table.vatCents} = 0`,
    ),
  ],
);

/**
 * A full credit note, which is how an invoice is canceled: it cancels the invoice in Qonto whether
 * it was paid or not, and it is the correcting document German VAT law expects. At most one per
 * invoice, because we only ever credit the whole amount.
 */
export const creditNote = pgTable(
  "credit_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .unique()
      .references(() => invoice.id, { onDelete: "restrict" }),
    qontoCreditNoteId: varchar("qonto_credit_note_id", { length: 64 }).notNull().unique(),
    number: varchar("number", { length: 40 }).notNull().unique(),
    reason: varchar("reason", { length: 500 }).notNull(),
    /**
     * True when the invoice had been paid before it was credited. A credit note moves no money, so
     * this stays owed until someone makes the transfer in Qonto and records it below.
     */
    refundOwed: boolean("refund_owed").notNull(),
    refundDoneAt: timestamp("refund_done_at"),
    refundDoneByUserId: uuid("refund_done_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdByUserId: uuid("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // A refund can only be recorded as done if one was owed, and a person can only be named as
    // having done it once it is done. The person may later be deleted, so the reverse is allowed.
    check(
      "credit_note_refund_done_only_if_owed",
      sql`${table.refundDoneAt} IS NULL OR ${table.refundOwed}`,
    ),
    check(
      "credit_note_refund_by_only_if_done",
      sql`${table.refundDoneByUserId} IS NULL OR ${table.refundDoneAt} IS NOT NULL`,
    ),
  ],
);

/**
 * The next number per series and year, so each number is assigned once (§ 14 Abs. 4 Nr. 4 UStG).
 *
 * Taken with `INSERT … ON CONFLICT (series, year) DO UPDATE SET last_value = last_value + 1
 * RETURNING last_value`, because the first document of a year has no row to update yet. The
 * number is committed before Qonto is called: if that call then fails, the number stays used and
 * unissued, which leaves a gap but never a duplicate. The law asks for uniqueness, and a gap with a
 * logged reason is the safe side of that trade.
 */
export const documentNumberCounter = pgTable(
  "document_number_counter",
  {
    series: documentSeriesEnum("series").notNull(),
    year: integer("year").notNull(),
    lastValue: integer("last_value").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.series, table.year] })],
);

/**
 * An order whose outcome in Qonto is not known yet (lib/billing/order-check.ts). Written in its own
 * committed statement just before Qonto is asked to issue the invoice, and deleted in the order's
 * transaction once Qonto has clearly issued or clearly refused it. A row that stays means Qonto did
 * not answer clearly, or the order broke after the call: an invoice may exist that we did not
 * record. While a row exists every order for the account is refused, until a platform admin has
 * checked Qonto and cleared it.
 *
 * Its own table rather than a column on billing_account, because the order holds that row's lock
 * while it runs: the mark has to be committed before the Qonto call without waiting on that lock,
 * so a waiting order sees it the moment the lock is released.
 */
export const orderCheck = pgTable("order_check", {
  billingAccountId: uuid("billing_account_id")
    .primaryKey()
    .references(() => billingAccount.id, { onDelete: "restrict" }),
  /** The number the order was issuing, to look up in Qonto. */
  invoiceNumber: varchar("invoice_number", { length: 40 }).notNull(),
  since: timestamp("since").defaultNow().notNull(),
});
