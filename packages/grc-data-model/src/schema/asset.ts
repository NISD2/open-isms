import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { assetMfaMethodEnum } from "../enums";
import { supplier } from "./supplier";

export const asset = pgTable(
  "asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    description: text("description"),

    // BSI-200-2 §8.1 — identical assets grouped, e.g. "45 laptops"
    quantity: integer("quantity").default(1).notNull(),

    isOT: boolean("is_ot").default(false),
    isCritical: boolean("is_critical").default(false),
    owner: varchar("owner", { length: 255 }),
    location: varchar("location", { length: 255 }),

    // Superseded by asset_provider, which allows several providers per asset and was backfilled
    // from this column (migration 0005). No code reads or writes it any more; it is dropped once
    // no running release does either.
    supplierId: uuid("supplier_id").references(() => supplier.id, {
      onDelete: "set null",
    }),

    ipAddress: varchar("ip_address", { length: 45 }),
    hostname: varchar("hostname", { length: 255 }),
    operatingSystem: varchar("operating_system", { length: 255 }),
    softwareVersion: varchar("software_version", { length: 255 }),

    // CIR 11.2 — per-asset access management, CIR 11.3 — privileged accounts
    accessManagement: varchar("access_management", { length: 255 }),
    privilegedAccountCount: integer("privileged_account_count").default(0),

    hasMfa: boolean("has_mfa").default(false),
    // Which second factor signing in takes; it can differ per program (an app here, codes by
    // email there). It means something only while has_mfa is true, and readers ignore it otherwise.
    mfaMethod: assetMfaMethodEnum("mfa_method"),
    encryptionAtRest: varchar("encryption_at_rest", { length: 100 }),
    encryptionInTransit: varchar("encryption_in_transit", { length: 100 }),
    cryptoImplementation: varchar("crypto_implementation", { length: 255 }),
    hasBackup: boolean("has_backup").default(false),
    lastPatchDate: date("last_patch_date"),
    lastVulnScanDate: date("last_vuln_scan_date"),

    backupFrequency: varchar("backup_frequency", { length: 50 }),
    backupLocation: varchar("backup_location", { length: 255 }),
    lastBackupTestDate: date("last_backup_test_date"),
    rto: integer("rto"),
    rpo: integer("rpo"),

    // GDPR — Art. 30 prefill trigger
    processesPersonalData: boolean("processes_personal_data").default(false),

    // CIR 2024/2690 — end-of-life date
    endOfLife: date("end_of_life"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_asset_company").on(table.companyId),
    index("idx_asset_type").on(table.type),
    index("idx_asset_critical").on(table.isCritical),
    index("idx_asset_supplier").on(table.supplierId),
  ],
);
