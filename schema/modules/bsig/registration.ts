/**
 * BSI Registration — Company registration with the BSI (§33 BSIG)
 *
 * Extension table for company (1:1). Each company subject to BSIG must
 * register with the BSI, declare IP ranges, and report EU country presence.
 *
 * References: company
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { company } from "@nisd2/isms-schema/tables/organization";

export const bsiRegistration = pgTable(
  "bsi_registration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => company.id)
      .notNull()
      .unique(),

    // Registration status
    isRegistered: boolean("is_registered").default(false),
    registrationDate: date("registration_date"),
    registrationRef: varchar("registration_ref", { length: 100 }),

    // Network infrastructure declaration (§33 Abs. 1 Nr. 4 BSIG)
    ipRangesV4: text("ip_ranges_v4").array().default(sql`'{}'::text[]`),
    ipRangesV6: text("ip_ranges_v6").array().default(sql`'{}'::text[]`),

    // EU country presence (jurisdiction determination)
    euCountries: text("eu_countries").array().default(sql`'{}'::text[]`),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_bsi_registration_company").on(table.companyId)]
);
