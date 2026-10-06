import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const partnerContractLocaleEnum = pgEnum("partner_contract_locale", ["de", "en"]);

/** The agreement as it was offered: what the partner reads, accepts and receives by email. */
export interface PartnerContractBody {
  readonly title: string;
  readonly parties: readonly string[];
  readonly sections: readonly {
    readonly heading: string;
    readonly blocks: readonly (
      | { readonly kind: "text"; readonly text: string }
      | { readonly kind: "list"; readonly items: readonly string[] }
    )[];
  }[];
}

/**
 * A partner agreement offered to a firm that recommends us, and its acceptance.
 *
 * The firm, its contact and the commission are data, for the reason advisory_partner gives: this
 * repository is public, and who our partners are and what we pay them is commercial information
 * that belongs in the operator's database.
 *
 * The text is stored as offered, so what the partner read is what they accepted even after the
 * wording in messages/partnerContract changes. The acceptance is recorded on the row, all of it or
 * none, with the hash of the text that was accepted.
 */
export const partnerContract = pgTable(
  "partner_contract",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** The link's secret, 64 hex characters. Knowing it is what lets someone read and accept. */
    token: varchar("token", { length: 64 }).notNull().unique(),
    locale: partnerContractLocaleEnum("locale").notNull(),

    partnerCompany: varchar("partner_company", { length: 200 }).notNull(),
    /** Who it is meant for, to fill in the signing form. The signer may be someone else. */
    partnerContactName: varchar("partner_contact_name", { length: 200 }),
    partnerEmail: varchar("partner_email", { length: 320 }),

    commissionPercent: integer("commission_percent").notNull(),
    /** Months of each referred customer's contract the commission covers; null while they pay. */
    commissionMonths: integer("commission_months"),

    templateVersion: varchar("template_version", { length: 20 }).notNull(),
    body: jsonb("body").$type<PartnerContractBody>().notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdByEmail: varchar("created_by_email", { length: 320 }).notNull(),
    /** An offer taken back before anyone accepted it. The link stops working. */
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),

    signedAt: timestamp("signed_at", { withTimezone: true }),
    signerName: varchar("signer_name", { length: 200 }),
    signerEmail: varchar("signer_email", { length: 320 }),
    signerIp: varchar("signer_ip", { length: 64 }),
    signerUserAgent: text("signer_user_agent"),
    /** SHA-256 of the plain text the signer accepted (lib/partner-contract/text). */
    signedTextSha256: varchar("signed_text_sha256", { length: 64 }),
  },
  (table) => [
    check(
      "partner_contract_commission_percent",
      sql`${table.commissionPercent} between 1 and 50`,
    ),
    check(
      "partner_contract_commission_months",
      sql`${table.commissionMonths} is null or ${table.commissionMonths} between 1 and 120`,
    ),
    check(
      "partner_contract_acceptance_whole",
      sql`(${table.signedAt} is null) = (${table.signerName} is null)
        and (${table.signedAt} is null) = (${table.signerEmail} is null)
        and (${table.signedAt} is null) = (${table.signedTextSha256} is null)`,
    ),
    check(
      "partner_contract_withdrawn_unsigned",
      sql`${table.withdrawnAt} is null or ${table.signedAt} is null`,
    ),
    index("idx_partner_contract_created").on(table.createdAt),
  ],
);
