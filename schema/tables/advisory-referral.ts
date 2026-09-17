import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { advisoryRequest } from "./advisory-request";

/**
 * One row per time a request was passed to a firm.
 *
 * A child table rather than two columns on the request, because the same
 * request can legitimately go to more than one firm: a company that wants
 * supply chain work and an audit is two engagements, and a firm that declines
 * frees the request to go to the next one. Two columns on the parent could
 * only ever record the last one, which is the number that matters least.
 *
 * This is also what makes the money legible. What was invoiced is per referral,
 * not per request, so `SUM(fee_cents)` over a month is the revenue and
 * `fee_cents IS NULL` is the list of things to chase.
 *
 * Deliberately not a partner table. `partner` is a name until there is a second
 * firm and a reason to choose between them per request, at which point this
 * column becomes a foreign key in one migration rather than a data-cleaning
 * job. See the note on ADVISORY_PARTNERS for why it is constrained in code.
 */
export const advisoryReferral = pgTable(
  "advisory_referral",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => advisoryRequest.id, { onDelete: "cascade" }),

    /** Slug from ADVISORY_PARTNERS, not free text. */
    partner: varchar("partner", { length: 60 }).notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),

    /**
     * Agreed fee in cents, null until it is agreed. Cents because a price is
     * money and money in a float is a rounding bug waiting for an invoice.
     */
    feeCents: integer("fee_cents"),
    /** Set when the fee has actually been paid, not when it was invoiced. */
    paidAt: timestamp("paid_at"),

    note: text("note"),
  },
  (table) => [
    index("idx_advisory_referral_request").on(table.requestId),
    index("idx_advisory_referral_sent").on(table.sentAt),
    index("idx_advisory_referral_partner").on(table.partner),
  ],
);
