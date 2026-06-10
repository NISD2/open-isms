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

type InsertModel<T> = T extends { $inferInsert: infer I } ? I : never;

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
