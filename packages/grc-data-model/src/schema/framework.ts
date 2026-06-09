import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { frameworkEnum } from "../enums";

export const complianceFramework = pgTable("compliance_framework", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: frameworkEnum("code").notNull().unique(),
  version: varchar("version", { length: 50 }),
  effectiveDate: date("effective_date"),
  isActive: boolean("is_active").default(true),
  /** Prefix for category codes in UI — e.g. "NIS2-", "DSGVO-" */
  codePrefix: varchar("code_prefix", { length: 20 }),
  /** Translation key for sidebar label — e.g. "nis2", "dsgvo" */
  sidebarLabel: varchar("sidebar_label", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_framework_active").on(table.isActive),
]);


export const requirementCategory = pgTable("requirement_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  frameworkId: uuid("framework_id")
    .references(() => complianceFramework.id)
    .notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),

  // Direct links to source law / standard text.
  // referenceUrl = framework's primary source (EUR-Lex, iso.org, etc.).
  // nationalUrl  = national transposition if any (e.g. BSIG for NIS 2 in DE).
  referenceUrl: varchar("reference_url", { length: 500 }),
  nationalUrl: varchar("national_url", { length: 500 }),

  /** Roles this category is relevant to — e.g. ["ciso", "cto"] */
  relevantRoles: jsonb("relevant_roles").$type<string[]>(),

  // BSI IT-Grundschutz cross-reference
  grundschutzModule: varchar("grundschutz_module", { length: 50 }),

  // Ordering
  sortOrder: integer("sort_order").notNull(),
  estimatedMinutes: integer("estimated_minutes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_category_framework").on(table.frameworkId),
]);
