import "@/lib/server-guard";
import { eq, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { user } from "@/schema";

/**
 * The person's key version (`user.mcp_key_version`), which every key and assistant sign-in
 * carries. Reading it tells whether a key still counts; bumping it ends them all at once.
 */

/** The current version; null when the account is gone. */
export async function mcpKeyVersionOf(
  db: DbOrTx,
  userId: string,
): Promise<number | null> {
  const [row] = await db
    .select({ version: user.mcpKeyVersion })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.version ?? null;
}

/** The next version, ending every key and assistant sign-in from before; null when no account. */
export async function bumpMcpKeyVersion(
  db: DbOrTx,
  userId: string,
): Promise<number | null> {
  const [row] = await db
    .update(user)
    .set({ mcpKeyVersion: sql`${user.mcpKeyVersion} + 1` })
    .where(eq(user.id, userId))
    .returning({ version: user.mcpKeyVersion });
  return row?.version ?? null;
}
