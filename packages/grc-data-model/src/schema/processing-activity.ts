import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { legalBasisEnum } from "../enums";
import { supplier } from "./supplier";

/**
 * The record of processing activities (Art. 30(1) GDPR): one row per activity the company carries
 * out as controller, with what the article asks of each. The controller's name and contacts and
 * its data protection officer (30(1)(a)) are the company's own; the security measures (30(1)(g))
 * are the company's written description of them. Kept in writing, which electronic form is
 * (30(3)). Every column but the name is null until the company has answered it.
 */
export const processingActivity = pgTable(
  "processing_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),

    /** What the company calls the activity, for example "Payroll". */
    name: varchar("name", { length: 255 }).notNull(),
    /**
     * The catalogue item it was added as (lib/processing-activities/catalog.ts), so a second pass
     * adds nothing twice and a rename keeps what the activity is. Null for the company's own.
     */
    catalogId: varchar("catalog_id", { length: 80 }),

    /** 30(1)(b): what the data is processed for. */
    purpose: text("purpose"),
    /**
     * Art. 6(1): the lawful bases the activity rests on, often more than one (payroll: the
     * employment contract and the tax and social security duties). Not asked by Art. 30, but the
     * company must be able to show it (Art. 5(2)).
     */
    legalBases: legalBasisEnum("legal_bases").array(),
    /** Art. 6(1)(f): the interest pursued, where the activity rests on legitimate interests. */
    legitimateInterests: text("legitimate_interests"),
    /** 30(1)(c): whose data, as categories of people. */
    dataSubjects: text("data_subjects"),
    /** 30(1)(c): which data, as categories. */
    dataCategories: text("data_categories"),
    /**
     * Whether the data includes special categories (Art. 9(1)) or data on criminal convictions
     * (Art. 10): what keeps the Art. 30(5) exemption from applying and has its own conditions.
     */
    specialCategories: boolean("special_categories"),
    /**
     * 30(1)(d): who else the data is disclosed to, inside and outside the company. The suppliers
     * that receive it are linked instead (`processingActivitySupplier`).
     */
    recipients: text("recipients"),
    /**
     * 30(1)(e): whether the data goes to a country outside the EEA or an international organisation
     * other than through the linked suppliers, whose transfers their own row records once.
     */
    transfersOutsideEea: boolean("transfers_outside_eea"),
    /** 30(1)(e): where to and on which safeguard, where it does. */
    transferDetails: text("transfer_details"),
    /** 30(1)(f): when the data is erased, where it is possible to say. */
    retention: text("retention"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_processing_activity_company").on(table.companyId),
    // A catalogue item is on a company's record once; its own activities may repeat names.
    uniqueIndex("uq_processing_activity_catalog")
      .on(table.companyId, table.catalogId)
      .where(sql`${table.catalogId} IS NOT NULL`),
  ],
);

/**
 * The suppliers that receive an activity's data (Art. 30(1)(d); a processor is a recipient,
 * Art. 4(9)). The activity's transfers through them (30(1)(e)) are read from each supplier's row,
 * so a transfer is recorded once per supplier, not once per activity. Owned through the activity:
 * every query reaches it by the company's activities, and it goes with either side.
 */
export const processingActivitySupplier = pgTable(
  "processing_activity_supplier",
  {
    activityId: uuid("activity_id")
      .notNull()
      .references(() => processingActivity.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.supplierId] }),
    index("idx_processing_activity_supplier_supplier").on(table.supplierId),
  ],
);
