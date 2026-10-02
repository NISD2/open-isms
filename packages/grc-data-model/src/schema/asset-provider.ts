import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { asset } from "./asset";
import { supplier } from "./supplier";

/**
 * Who provides an asset for the company: suppliers on its own list that sell it, run it or look
 * after it, any number of them (a program bought through a reseller and run by its maker has two).
 * An asset with no row is run in house, or its provider is not recorded. The tenant is the
 * asset's; a link is only ever written between an asset and a supplier of the same company.
 */
export const assetProvider = pgTable(
  "asset_provider",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .references(() => asset.id, { onDelete: "cascade" })
      .notNull(),
    supplierId: uuid("supplier_id")
      .references(() => supplier.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_asset_provider_pair").on(table.assetId, table.supplierId),
    index("idx_asset_provider_supplier").on(table.supplierId),
  ],
);
