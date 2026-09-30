/**
 * Type bridge: drizzle-zod output → Drizzle insert/update values.
 *
 * drizzle-zod schemas use `| null` for nullable columns, while Drizzle's
 * $inferInsert marks them as optional (`?`). The values are structurally
 * identical at runtime, but TypeScript requires an assertion.
 *
 * Centralizing the cast here keeps router code clean. When columns change
 * via migrations, both drizzle-zod and Drizzle types update from the same
 * source table definition — no manual sync needed.
 */

import { type Column, getTableColumns, type Table } from "drizzle-orm";

type InsertModel<T> = T extends { $inferInsert: infer I } ? I : never;
type Columns<T extends Table> = T["_"]["columns"];

/**
 * The table columns a drizzle-zod pick names, as a map `select()` and
 * `returning()` accept. Lets a projection be decided once, as a Zod pick, and
 * reused for reads and write results instead of listing the columns again.
 */
export function pickColumns<T extends Table, K extends keyof Columns<T> & string>(
  table: T,
  shape: Record<K, unknown>,
): Pick<Columns<T>, K> {
  const columns: Record<string, Column> = getTableColumns(table);
  const picked = Object.fromEntries(Object.keys(shape).map((key) => [key, columns[key]]));
  return picked as Pick<Columns<T>, K>;
}

export function insertRow<T extends { $inferInsert: unknown }>(
  _table: T,
  values: Record<string, unknown>,
): InsertModel<T> {
  return values as InsertModel<T>;
}

export function updateRow<T extends { $inferInsert: unknown }>(
  _table: T,
  values: Record<string, unknown>,
): Partial<InsertModel<T>> {
  return values as Partial<InsertModel<T>>;
}
