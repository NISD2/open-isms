/**
 * Requirement ↔ control crosswalk — THE ONE EDITORIAL TABLE IN THE GUIDED FORM.
 *
 * Every other input to the form comes from a source: the statute from the official XML export of
 * the BSIG, the control grades from the BSI's own XML and PDF, the facts from the company's
 * registers, the judgement from the company. This mapping, which BSI requirements stand behind
 * which of our items, is ours. `provenance` says so on every row and the interface repeats it,
 * because a default is a claim.
 *
 * Many-to-many on purpose: one BSI requirement can stand behind more than one of our items (an
 * identity and access requirement supports both § 30 Abs. 2 Nr. 9 and Nr. 10). A company therefore
 * decides a control ONCE, and the decision is shown under every item it supports, which is why
 * `control_decision` keys on company and control rather than on the item.
 *
 * This replaces the unused free-text `requirement.grundschutz_ref` column, which is empty on all
 * 49 NIS 2 requirements and cannot express a many-to-many mapping.
 *
 * Supports: the guided form's step composition.
 * References: requirement, control.
 */
import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { control } from "./control";
import { requirement } from "./requirement";

export const requirementControl = pgTable(
  "requirement_control",
  {
    requirementId: uuid("requirement_id")
      .references(() => requirement.id)
      .notNull(),
    controlId: varchar("control_id", { length: 32 }).notNull(),
    edition: varchar("edition", { length: 32 }).notNull(),
    /**
     * Where this mapping came from. "ours" is the only value today and is the honest default;
     * it exists so that a future BSI or ENISA crosswalk can be told apart from our judgement.
     */
    provenance: varchar("provenance", { length: 16 }).notNull().default("ours"),
    /** Why this control was mapped to this item, for the reviewer of the mapping. */
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.requirementId, table.controlId, table.edition],
    }),
    foreignKey({
      columns: [table.controlId, table.edition],
      foreignColumns: [control.id, control.edition],
      name: "requirement_control_control_fk",
    }),
    index("idx_requirement_control_requirement").on(table.requirementId),
    index("idx_requirement_control_control").on(table.controlId, table.edition),
  ],
);
