// Reference Drizzle schema for storing supplier RESPONSES.
// Field definitions live in the Zod schema; this file is just a starting
// point for response persistence. Adapt FK targets and tenant model to your
// stack. The only contract is that fieldId matches an id from
// supply-chain-questionnaire.json.

import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const supplierQuestionnaireSubmission = pgTable(
  "supplier_questionnaire_submission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id").notNull(),
    submittedBy: uuid("submitted_by").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    schemaVersion: varchar("schema_version", { length: 16 }).notNull(),
  },
  (table) => [
    index("idx_supplier_qsub_supplier").on(table.supplierId),
  ],
);

export const supplierQuestionnaireAnswer = pgTable(
  "supplier_questionnaire_answer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => supplierQuestionnaireSubmission.id, {
        onDelete: "cascade",
      }),
    fieldId: varchar("field_id", { length: 64 }).notNull(),
    value: jsonb("value"),
    notes: text("notes"),
  },
  (table) => [
    index("idx_supplier_qans_submission").on(table.submissionId),
    index("idx_supplier_qans_field").on(table.fieldId),
  ],
);
