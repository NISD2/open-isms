import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  evidenceTypeEnum,
  frequencyEnum,
  priorityEnum,
  requirementImportanceEnum,
  effortLevelEnum,
} from "../enums";
import { requirementCategory } from "./framework";

export const requirement = pgTable(
  "requirement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .references(() => requirementCategory.id)
      .notNull(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    parentId: uuid("parent_id"), // Self-ref: 1.1 → 1.1a, 1.1b

    evidenceType: evidenceTypeEnum("evidence_type").notNull(),

    importance: requirementImportanceEnum("importance").default("mandatory"),
    effort: effortLevelEnum("effort"),
    estimatedHours: integer("estimated_hours"),
    needsExternalHelp: boolean("needs_external_help").default(false),

    frequency: frequencyEnum("frequency").notNull(),
    priority: priorityEnum("priority").notNull(),

    appliesToEssential: boolean("applies_to_essential").default(true),
    appliesToImportant: boolean("applies_to_important").default(true),
    appliesToKritis: boolean("applies_to_kritis").default(true),
    sectorSpecific: text("sector_specific")
      .array()
      .default(sql`'{}'::text[]`),
    minEmployees: integer("min_employees"),

    legalRef: varchar("legal_ref", { length: 255 }),
    // frameworkRef = short structured reference within the framework:
    //   NIS 2 / GDPR / AI Act / CRA → Article number like "21(2)(a)"
    //   ISO 27001 / 42001          → Clause or Annex code like "5.1" or "A.5.9"
    frameworkRef: varchar("framework_ref", { length: 100 }),
    cirReference: varchar("cir_reference", { length: 255 }),
    cirApplicability: varchar("cir_applicability", { length: 20 }),
    enisaGuidanceRef: varchar("enisa_guidance_ref", { length: 255 }),

    penaltyAmount: varchar("penalty_amount", { length: 255 }),

    moduleRef: varchar("module_ref", { length: 50 }),

    requiredSignOffRole: varchar("required_sign_off_role", { length: 50 }),

    grundschutzRef: varchar("grundschutz_ref", { length: 100 }),

    templateVersion: integer("template_version").default(1).notNull(),

    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_requirement_category").on(table.categoryId),
    index("idx_requirement_parent").on(table.parentId),
    index("idx_requirement_priority").on(table.priority),
  ]
);

export const requirementPrerequisite = pgTable(
  "requirement_prerequisite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requirementId: uuid("requirement_id")
      .references(() => requirement.id)
      .notNull(),
    prerequisiteId: uuid("prerequisite_id")
      .references(() => requirement.id)
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_req_prereq_pair").on(
      table.requirementId,
      table.prerequisiteId
    ),
  ]
);
