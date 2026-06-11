/**
 * Sign-Off History — Append-only audit trail of sign-off snapshots
 *
 * Each sign-off creates a new version with a rich snapshot of entity data
 * and a chained checksum linking to the previous version.
 * The diff between two consecutive snapshots IS the audit trail.
 *
 * References: company, companyRequirementStatus, requirement, user
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";
import { companyRequirementStatus } from "./assessments";
import { requirement } from "@nisd2/grc-data-model/schema";

/** Shape of the rich snapshot captured at each sign-off */
export interface SignOffSnapshotData {
  source: "intake" | "module" | "editor" | "module_confirm";
  templateVersion: number;
  companyProfile: Record<string, unknown>;
  data: Record<string, unknown>;
  evidenceRefs: Array<{
    id: string;
    fileName: string;
    contentHash: string | null;
    version: number;
  }>;
}

export const signOffHistory = pgTable(
  "sign_off_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),
    statusId: uuid("status_id")
      .references(() => companyRequirementStatus.id)
      .notNull(),
    requirementId: uuid("requirement_id")
      .references(() => requirement.id)
      .notNull(),
    version: integer("version").notNull(),
    signedOffBy: uuid("signed_off_by")
      .references(() => user.id)
      .notNull(),
    signedOffRole: varchar("signed_off_role", { length: 255 }),
    snapshot: jsonb("snapshot").$type<SignOffSnapshotData>().notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    previousChecksum: varchar("previous_checksum", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sign_off_history_status").on(table.statusId),
    index("idx_sign_off_history_company").on(table.companyId),
    index("idx_sign_off_history_requirement").on(table.requirementId),
    index("idx_sign_off_history_created").on(table.createdAt),
    // Audit L-1 / EW-2 (2026-06-11): version assignment is
    // read-then-write (SELECT max(version) WHERE statusId, INSERT
    // version=max+1). Today's chain writers serialize through the
    // row lock on companyRequirementStatus by side effect, so the
    // invariant holds. Any future writer that inserts a chain row
    // without acquiring the status-row lock first would silently
    // produce two rows with the same (statusId, version) — the
    // unique constraint makes that fail loudly instead.
    uniqueIndex("uq_sign_off_history_status_version").on(
      table.statusId,
      table.version,
    ),
  ]
);
