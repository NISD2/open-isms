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

import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { documentSeriesEnum, invoiceSourceEnum } from "../enums";
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_invoice_billing_account").on(table.billingAccountId)],
);

/**
 * A full credit note, which is how an invoice is canceled: it cancels the invoice in Qonto whether
 * it was paid or not, and it is the correcting document German VAT law expects. At most one per
 * invoice, because we only ever credit the whole amount.
 */
export const creditNote = pgTable("credit_note", {
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
});

/**
 * The next number per series and year. Taken with `UPDATE … RETURNING` inside the same transaction
 * that writes the document, so numbers are gapless and each is assigned once
 * (§ 14 Abs. 4 Nr. 4 UStG).
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
