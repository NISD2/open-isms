/**
 * Supplier portal — file-first attestations
 *
 * After the C1/C2/C3 cleanup, the supplier portal data lives in:
 *   - `company`               — supplier identity + questionnaire (T1)
 *   - `supplier`              — bilateral supplier↔customer relationship (C3)
 *   - `asset`                 — entity AND supplier-declared assets (C1)
 *   - `incident`              — entity AND supplier-published incidents (C2)
 *   - `company_certification` — file-first attestations (this file)
 *
 * Only `company_certification` lives here because it has its own dedicated
 * shape (file metadata indexed by validUntil). Everything else moved into
 * the entity-side equivalents to avoid parallel-table redundancy.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { company } from "@nisd2/isms-schema/tables/organization";

// ---------------------------------------------------------------------------
// Company certification — file-first attestations with expiry
// ---------------------------------------------------------------------------

/**
 * Generic company-level certification store. Used by the supplier portal today
 * (every company with actsAsSupplier=true uploads ISO 27001 / BSI Grundschutz
 * / SOC 2 / TISAX PDFs here) and reusable by the entity portal in the future
 * if NIS2 entities want to track their own certs.
 *
 * Kept as a dedicated table because:
 *   - Files need indexing by validUntil for expiry digest
 *   - File metadata (storageKey, fileName, fileSize, contentHash) doesn't fit
 *     cleanly into JSONB
 *   - Validity dates need range queries
 *
 * The cert "type" is an open varchar (not pgEnum) because new cert types appear
 * over time without requiring a migration.
 */
export const companyCertification = pgTable(
  "company_certification",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Owning company. */
    companyId: uuid("company_id")
      .references(() => company.id, { onDelete: "cascade" })
      .notNull(),

    /**
     * Open enum for forwards-compat: 'iso27001', 'iso27017', 'iso27018', 'bsi_c5',
     * 'bsi_grundschutz', 'tisax_al1' | 'tisax_al2' | 'tisax_al3', 'soc2_type1',
     * 'soc2_type2', 'isae3402', 'eucc', 'pen_test', 'other', ...
     */
    type: varchar("type", { length: 50 }).notNull(),
    typeOther: varchar("type_other", { length: 255 }),

    scope: text("scope"),
    auditor: varchar("auditor", { length: 255 }),

    validFrom: date("valid_from"),
    validUntil: date("valid_until").notNull(),

    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    fileName: varchar("file_name", { length: 500 }),
    fileSize: integer("file_size"),
    contentHash: varchar("content_hash", { length: 64 }),

    /** 'active' | 'expired' | 'revoked'. Computed nightly by cron from validUntil. */
    status: varchar("status", { length: 20 }).default("active").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_company_cert_company").on(table.companyId),
    index("idx_company_cert_valid_until").on(table.validUntil),
    index("idx_company_cert_type").on(table.type),
  ],
);
