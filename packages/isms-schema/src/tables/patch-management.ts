/**
 * Patch Management — Per-asset patch/vulnerability tracking
 *
 * Tracks individual patches: when released, when applied,
 * and exceptions with approval and expiry dates.
 *
 * Supports: 6.4 (Patch Management Tracking)
 * References: companies, users, assets
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";
import { asset } from "@nisd2/grc-data-model/schema";
import { patchStatusEnum } from "../enums";

export const patchRecord = pgTable(
  "patch_record",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    assetId: uuid("asset_id")
      .references(() => asset.id)
      .notNull(),

    // Patch details
    patchIdentifier: varchar("patch_identifier", { length: 255 }).notNull(),
    severity: varchar("severity", { length: 50 }).notNull(), // CVSS: critical, high, medium, low
    title: varchar("title", { length: 500 }),
    releaseDate: date("release_date"),
    status: patchStatusEnum("status").notNull().default("pending"),
    appliedAt: timestamp("applied_at"),

    // Exception tracking
    exceptionReason: text("exception_reason"),
    exceptionApprovedBy: uuid("exception_approved_by").references(() => user.id),
    exceptionExpiresAt: date("exception_expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_patch_record_company").on(table.companyId),
    index("idx_patch_record_asset").on(table.assetId),
    index("idx_patch_record_status").on(table.status),
  ]
);
