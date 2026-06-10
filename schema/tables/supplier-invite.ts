/**
 * Supplier invite — entity-side pending invite for Direction B.
 *
 * Used when a NIS2 entity wants a supplier to fill their security profile but
 * the supplier doesn't have a Sorzel account yet. The entity creates a row
 * here, the supplier receives a magic-link email, clicks it, signs up — and
 * on signup we look up pending invites for that email and create the matching
 * supplier_relationship rows binding the new supplier company to every entity
 * that invited them.
 *
 * Distinct from supplier_relationship because:
 *   - supplier_relationship is the ACTIVE state (supplier exists, sharing on)
 *   - supplier_invite is the PENDING state (supplier doesn't exist yet)
 *
 * After acceptance: supplier_invite.acceptedAt is set and supplier_relationship
 * rows are inserted in the same transaction. The invite row is kept for
 * audit purposes (don't delete).
 *
 * References: companies, users
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { company } from "@nisd2/isms-schema/tables/organization";

export const supplierInvite = pgTable(
  "supplier_invite",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** The entity sending the invite. */
    fromCompanyId: uuid("from_company_id")
      .references(() => company.id, { onDelete: "cascade" })
      .notNull(),

    /** Supplier email (lowercased). May or may not exist as a Sorzel user. */
    toEmail: varchar("to_email", { length: 255 }).notNull(),

    /**
     * 64-char hex magic-link token. Knowledge of this token grants the right
     * to accept the invite and create a supplier company bound to the inviting
     * entity. The token IS the credential for the magic-link signup flow.
     */
    token: varchar("token", { length: 64 }).notNull().unique(),

    /** Optional personal message from the entity to include in the email. */
    message: text("message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** 30 days from creation by default. After this the token is rejected. */
    expiresAt: timestamp("expires_at").notNull(),
    /** Set in the same transaction as supplier signup. Null = pending. */
    acceptedAt: timestamp("accepted_at"),
    /** The supplier company that accepted (after acceptance only). */
    acceptedByCompanyId: uuid("accepted_by_company_id").references(
      () => company.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    // Prevent duplicate active invites for the same (entity, email) pair —
    // re-invites just bump the existing row's timestamps.
    uniqueIndex("uq_supplier_invite_pair").on(
      table.fromCompanyId,
      table.toEmail,
    ),
    // Fast lookup when a supplier signs up — we look for pending invites
    // matching their email.
    index("idx_supplier_invite_to_email").on(table.toEmail),
  ],
);
