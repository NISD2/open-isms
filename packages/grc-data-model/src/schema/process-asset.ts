import { sql } from "drizzle-orm";
import { check, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { asset } from "./asset";

/**
 * What a business process needs to keep going: the systems and rooms on the company's own list
 * it runs on (BSI-Standard 200-4 p. 187; 300-1 Anhang 2, the process with its essential
 * applications). Both ends are assets of one company, the process end a `process` row; a link is
 * only ever written between two assets of the same company, as asset_provider is. Who provides a
 * needed system is reached through asset_provider, not picked again.
 *
 * No times live here. How long a needed asset may be down is the shortest max_outage of the
 * processes linked to it (a system two processes share takes the shorter time, 200-4 p. 188),
 * computed where it is shown.
 */
export const processAsset = pgTable(
  "process_asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    processId: uuid("process_id")
      .references(() => asset.id, { onDelete: "cascade" })
      .notNull(),
    assetId: uuid("asset_id")
      .references(() => asset.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_process_asset_pair").on(table.processId, table.assetId),
    index("idx_process_asset_asset").on(table.assetId),
    check("process_asset_two_things", sql`${table.processId} <> ${table.assetId}`),
  ],
);
