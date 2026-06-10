/**
 * Role-to-category mapping — driven by DB `relevantRoles` column.
 *
 * Each requirementCategory declares which roles it's relevant to via
 * the `relevant_roles` jsonb column. Adding a new framework or changing
 * role assignments = data change, zero code changes.
 */
import { sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { requirementCategory } from "@/schema";

// Re-export shared constants so server-side callers don't need two imports
export { ALL_ROLE_KEYS, type RoleKey } from "./role-keys";
import type { RoleKey } from "./role-keys";

/** Display ordering for team hierarchy. Lower = more senior. */
export const ROLE_HIERARCHY: Record<RoleKey, number> = {
  ceo: 1,
  ciso: 2,
  cto: 3,
  coo: 4,
  cpo: 5,
  hr_director: 6,
  legal: 7,
  dpo: 8,
};

/**
 * Get all category slugs relevant to a role, across all frameworks.
 * Uses the `relevant_roles` jsonb column with @> containment operator.
 */
export async function getSlugsForRole(
  db: DbOrTx,
  roleKey: import("./role-keys").RoleKey,
): Promise<string[]> {
  const rows = await db
    .select({ slug: requirementCategory.slug })
    .from(requirementCategory)
    .where(sql`${requirementCategory.relevantRoles} @> ${JSON.stringify([roleKey])}::jsonb`);

  return rows.map((r) => r.slug);
}
