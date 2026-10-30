/**
 * Ownership transfers: who owns a company (`company.ownerId`), handed from one member to another.
 *
 * The owner always stays an admin and cannot be removed, and erasing the owner's account tears the
 * company down (lib/gdpr/erase-user.ts). So the handover is a record of its own: the owner asks, the
 * recipient accepts while signed in as themselves, and the row keeps who, to whom, how and when.
 * The platform operator can assign a new owner when the old one is gone; that row is accepted at
 * once and carries the reason.
 *
 * People are referenced with "set null", like `company.ownerId`, so erasing an account never
 * blocks on a transfer row; the company cascades, so tearing a company down takes its rows along.
 */

import { company, user } from "@nisd2/isms-schema/tables/organization";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const OWNERSHIP_TRANSFER_STATUSES = ["pending", "accepted", "cancelled"] as const;
export type OwnershipTransferStatus = (typeof OWNERSHIP_TRANSFER_STATUSES)[number];

/** The owner asked and the recipient accepted, or the platform operator assigned the owner. */
export const OWNERSHIP_TRANSFER_METHODS = ["self_service", "platform_admin"] as const;
export type OwnershipTransferMethod = (typeof OWNERSHIP_TRANSFER_METHODS)[number];

const inList = (values: readonly string[]) =>
  sql.raw(values.map((value) => `'${value}'`).join(", "));

export const ownershipTransfer = pgTable(
  "ownership_transfer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id, { onDelete: "cascade" })
      .notNull(),
    /** The owner when the transfer was made. Null when the operator assigns one to an ownerless company. */
    fromUserId: uuid("from_user_id").references(() => user.id, { onDelete: "set null" }),
    toUserId: uuid("to_user_id").references(() => user.id, { onDelete: "set null" }),
    /** Who started it: the owner, or the operator on the platform-admin path. */
    initiatedBy: uuid("initiated_by").references(() => user.id, { onDelete: "set null" }),
    method: varchar("method", { length: 16 }).$type<OwnershipTransferMethod>().notNull(),
    status: varchar("status", { length: 16 })
      .$type<OwnershipTransferStatus>()
      .default("pending")
      .notNull(),
    /** Why the operator assigned the owner, and how it was verified. Required on that path. */
    reason: text("reason"),
    /** Who accepted or cancelled it: the recipient, the owner, or the operator. */
    decidedBy: uuid("decided_by").references(() => user.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // One open handover per company at a time.
    uniqueIndex("uq_ownership_transfer_pending")
      .on(table.companyId)
      .where(sql`${table.status} = 'pending'`),
    index("idx_ownership_transfer_company").on(table.companyId, table.createdAt),
    check(
      "ownership_transfer_status",
      sql`${table.status} in (${inList(OWNERSHIP_TRANSFER_STATUSES)})`,
    ),
    check(
      "ownership_transfer_method",
      sql`${table.method} in (${inList(OWNERSHIP_TRANSFER_METHODS)})`,
    ),
    check(
      "ownership_transfer_not_to_self",
      sql`${table.fromUserId} <> ${table.toUserId}`,
    ),
    check(
      "ownership_transfer_decided_iff_closed",
      sql`(${table.status} = 'pending') = (${table.decidedAt} is null)`,
    ),
    check(
      "ownership_transfer_expires_after_start",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    // The operator's path is never a request someone else accepts, and always says why.
    check(
      "ownership_transfer_operator_reasoned",
      sql`${table.method} <> 'platform_admin' or (${table.status} = 'accepted' and length(trim(${table.reason})) >= 20)`,
    ),
  ],
);
