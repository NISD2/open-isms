import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { supplier } from "./supplier";

/**
 * One more person at a customer who is sent the link to the supplier's security profile, besides
 * the address on the supplier row itself. Each person has a link of their own, so removing one
 * person ends that link and no other.
 *
 * Only for a customer the supplier added itself (customer_company_id is null). A customer with an
 * account of its own is reached at the address it keeps there and has no rows here.
 */
export const supplierContact = pgTable(
  "supplier_contact",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** The supplier row (the customer) this person belongs to. Deleting the customer deletes them. */
    relationshipId: uuid("relationship_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "cascade" }),

    /** Lowercased. */
    email: varchar("email", { length: 255 }).notNull(),

    /**
     * 64-char hex bearer token, the same kind as supplier.unsubscribe_token: knowing it grants this
     * person the customer view at /supplier-access/{token} and the right to end their own access.
     */
    accessToken: varchar("access_token", { length: 64 }).notNull().unique(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_supplier_contact_pair").on(table.relationshipId, table.email),
    index("idx_supplier_contact_relationship").on(table.relationshipId),
    check(
      "supplier_contact_email_lowercase",
      sql`${table.email} = lower(${table.email})`,
    ),
    check("supplier_contact_token_hex", sql`${table.accessToken} ~ '^[0-9a-f]{64}$'`),
  ],
);
