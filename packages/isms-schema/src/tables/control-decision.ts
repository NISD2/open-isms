/**
 * Control decision — what a company recorded against one BSI control, append-only.
 *
 * This is the record § 30 Abs. 1 Satz 3 BSIG asks for: "Die Einhaltung der Verpflichtung nach
 * Satz 1 ist durch die Einrichtungen zu dokumentieren." One row per decision, never updated and
 * never deleted outside tenant erasure; a change of mind is a new row that supersedes the old one,
 * so the history is the documentation rather than a side effect of it.
 *
 * KEYED ON COMPANY AND CONTROL, NOT ON THE ITEM. The crosswalk from our items to BSI controls is
 * many-to-many: one identity-and-access control stands behind both the § 30 Abs. 2 Nr. 9 item and
 * the Nr. 10 item. A company decides such a control once, and every item it supports shows that
 * decision. Keying on the item would let the same control carry two contradicting outcomes.
 *
 * STALENESS IS COMPUTED ON READ, not by a background job. A no_object decision stores the register
 * it cited and the count it found; if that register is no longer empty the decision is stale and
 * the item cannot be signed. No invalidation worker, nothing to miss, nothing to swallow an error.
 *
 * Supports: the guided form (§ 30 Abs. 1 and Abs. 2 BSIG).
 * References: company, user, control.
 */

import { control } from "@nisd2/grc-data-model/schema";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { controlOutcomeEnum } from "../enums";
import { company, user } from "./organization";

/**
 * The company's own words on each of the five factors § 30 Abs. 1 Satz 2 BSIG names. Free text,
 * because the statute asks for a judgement and the judgement is the company's. Keys are the
 * factor ids; the German wording of each factor is a label in the interface, not a key.
 */
export type ControlJustification = {
  readonly risk_exposure?: string;
  readonly size?: string;
  readonly implementation_cost?: string;
  readonly likelihood_and_severity?: string;
  readonly societal_and_economic_impact?: string;
};

export const controlDecision = pgTable(
  "control_decision",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    controlId: varchar("control_id", { length: 32 }).notNull(),
    /** The Kompendium edition this decision was made against; it never moves under the company. */
    edition: varchar("edition", { length: 32 }).notNull(),

    outcome: controlOutcomeEnum("outcome").notNull(),

    /** covered_otherwise: which measure covers it instead. Required for that outcome. */
    reason: text("reason"),

    /**
     * no_object: the register the SERVER counted, the count it found (zero at the time), and when.
     * The client never supplies these. Without them a "we do not have that" is just a tick, and a
     * tick is how the critical-installation question switched off real duties on 24.09.2026.
     */
    evidenceModule: varchar("evidence_module", { length: 50 }),
    evidenceCount: integer("evidence_count"),
    evidenceAt: timestamp("evidence_at"),

    /** justified: all five factors, in the company's own words. */
    justification: jsonb("justification").$type<ControlJustification>(),

    /** deferred: a date, or a register whose next change resolves the deferral. One of the two. */
    deferredUntil: timestamp("deferred_until"),
    deferredUntilModule: varchar("deferred_until_module", { length: 50 }),

    decidedBy: uuid("decided_by")
      .references(() => user.id)
      .notNull(),
    decidedAt: timestamp("decided_at").defaultNow().notNull(),

    /** The decision this one replaces. Unique, so two concurrent writers cannot both supersede it. */
    supersedes: uuid("supersedes"),
  },
  (table) => [
    foreignKey({
      columns: [table.controlId, table.edition],
      foreignColumns: [control.id, control.edition],
      name: "control_decision_control_fk",
    }),
    /** The current decision per control is the newest row; this index serves that lookup. */
    index("idx_control_decision_current").on(
      table.companyId,
      table.controlId,
      table.decidedAt,
    ),
    index("idx_control_decision_company").on(table.companyId),
    uniqueIndex("idx_control_decision_supersedes").on(table.supersedes),
  ],
);
