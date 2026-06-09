/**
 * KPI — Security key performance indicator measurements
 *
 * Tracks KPI values over time for trending and management reporting.
 * Append-only: each measurement is a point-in-time snapshot.
 *
 * Supports: 7.4 (Security KPI Dashboard)
 * References: companies
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { company } from "./organization";
import { kpiStatusEnum } from "../enums";

export const kpiMeasurement = pgTable(
  "kpi_measurement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull(),

    kpiName: varchar("kpi_name", { length: 255 }).notNull(),
    measuredAt: timestamp("measured_at").notNull(),
    value: numeric("value").notNull(),
    target: numeric("target"),
    unit: varchar("unit", { length: 50 }),
    status: kpiStatusEnum("status"),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_kpi_measurement_company").on(table.companyId),
    index("idx_kpi_measurement_name").on(table.kpiName),
    index("idx_kpi_measurement_date").on(table.measuredAt),
  ]
);
