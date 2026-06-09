import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { incidentSeverityEnum, situationColorEnum } from "../enums";

export const incident = pgTable(
  "incident",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),

    severity: incidentSeverityEnum("severity").notNull(),
    situationColor: situationColorEnum("situation_color").default("yellow"),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),

    occurredAt: timestamp("occurred_at"),
    discoveredAt: timestamp("discovered_at").notNull(),
    resolvedAt: timestamp("resolved_at"),

    // CIA impact
    confidentialityImpacted: boolean("confidentiality_impacted").default(false),
    integrityImpacted: boolean("integrity_impacted").default(false),
    availabilityImpacted: boolean("availability_impacted").default(false),

    isMalicious: boolean("is_malicious"),
    hasCrossBorderImpact: boolean("has_cross_border_impact").default(false),
    affectedCountries: text("affected_countries").array().default(sql`'{}'::text[]`),
    isTargeted: varchar("is_targeted", { length: 20 }),

    affectedUsersCount: integer("affected_users_count"),
    affectedSystemsCount: integer("affected_systems_count"),
    estimatedFinancialDamage: decimal("estimated_financial_damage", { precision: 15, scale: 2 }),
    hasReputationalHarm: boolean("has_reputational_harm").default(false),
    serviceDeliveryImpact: text("service_delivery_impact"),

    // GDPR — Art. 4(12) personal-data-breach side
    requiresGdprNotification: boolean("requires_gdpr_notification").default(false),
    dataSubjectsAffected: integer("data_subjects_affected"),
    gdprNotifiedAt: timestamp("gdpr_notified_at"),
    notifiedDataSubjectsAt: timestamp("notified_data_subjects_at"),

    threatType: varchar("threat_type", { length: 255 }),
    rootCause: text("root_cause"),
    countermeasures: text("countermeasures"),
    preventiveMeasures: text("preventive_measures"),

    internalRef: varchar("internal_ref", { length: 100 }),
    createdBy: uuid("created_by"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_incident_company").on(table.companyId),
    index("idx_incident_severity").on(table.severity),
    index("idx_incident_discovered").on(table.discoveredAt),
  ],
);
