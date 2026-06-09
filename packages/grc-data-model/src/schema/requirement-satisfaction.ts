import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { equivalenceKindEnum } from "../enums";
import { requirement } from "./requirement";

export const requirementSatisfaction = pgTable(
  "requirement_satisfaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requirementAId: uuid("requirement_a_id")
      .references(() => requirement.id, { onDelete: "cascade" })
      .notNull(),
    requirementBId: uuid("requirement_b_id")
      .references(() => requirement.id, { onDelete: "cascade" })
      .notNull(),
    /**
     * Strength of the satisfaction relationship.
     *
     * `equivalent` - same underlying artefact satisfies both requirements
     *   (e.g. "same supplier register", "reuses the same methodology",
     *   "same incident record"). Safe for transitive propagation: if A is
     *   equivalent to B and B equivalent to C, signing A credits C.
     *
     * `overlapping` (default) - partial conceptual overlap that justifies
     *   direct credit, but does NOT compose transitively. Stops propagation
     *   at one hop.
     */
    equivalenceKind: equivalenceKindEnum("equivalence_kind")
      .default("overlapping")
      .notNull(),
    rationale: text("rationale"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_satisfaction_pair").on(table.requirementAId, table.requirementBId),
    index("idx_satisfaction_a").on(table.requirementAId),
    index("idx_satisfaction_b").on(table.requirementBId),
    index("idx_satisfaction_kind").on(table.equivalenceKind),
  ],
);
