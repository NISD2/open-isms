/**
 * Evidence — Uploaded documents proving compliance
 *
 * Lifecycle: draft → in_review → approved | rejected → expired
 * Supports versioning (v2 supersedes v1) and integrity checks (SHA-256).
 *
 * References: companyRequirementStatus (what it proves), users (uploader + reviewer)
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { evidenceStatusEnum } from "../enums";
import { user } from "./organization";
import { companyRequirementStatus } from "./assessments";

export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requirementStatusId: uuid("requirement_status_id")
      .references(() => companyRequirementStatus.id)
      .notNull(),

    // File
    fileName: varchar("file_name", { length: 500 }).notNull(),
    fileType: varchar("file_type", { length: 100 }),
    fileSize: integer("file_size"),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),

    // Description
    description: text("description"),
    uploadedBy: uuid("uploaded_by").references(() => user.id),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),

    // Lifecycle
    status: evidenceStatusEnum("status").default("draft").notNull(),
    version: integer("version").default(1).notNull(),
    previousVersionId: uuid("previous_version_id"),

    // Review
    reviewedBy: uuid("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),

    // Integrity
    contentHash: varchar("content_hash", { length: 64 }),

    // Validity
    validFrom: date("valid_from"),
    validUntil: date("valid_until"),
  },
  (table) => [
    index("idx_evidence_requirement_status").on(table.requirementStatusId),
    index("idx_evidence_status").on(table.status),
  ]
);
