import { createHash } from "node:crypto";
import type { SignOffSnapshotData } from "@nisd2/isms-schema/tables/sign-off-history";
import { signOffHistory } from "@nisd2/isms-schema/tables/sign-off-history";
import { desc, eq } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { TablesRelationalConfig } from "drizzle-orm/relations";

/**
 * Database parameter accepted by the chain helpers: a database or a
 * transaction, with any schema. The helpers use the select builder only, so
 * the schema generic stays open and no caller has to cast.
 */
export type ChainDb<
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
  TSchema extends TablesRelationalConfig = TablesRelationalConfig,
> = PgDatabase<NodePgQueryResultHKT, TFullSchema, TSchema>;

/**
 * Recursively sort object keys for deterministic JSON serialization.
 * Dates → ISO strings. Arrays preserved in order. Primitives pass through.
 */
export function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Compute a chained SHA-256 checksum for a sign-off history entry.
 * Chain: hash(statusId + version + signedOffBy + canonical(snapshot) + previousChecksum|"GENESIS")
 */
export function computeChainedChecksum(params: {
  statusId: string;
  version: number;
  signedOffBy: string;
  snapshot: SignOffSnapshotData;
  previousChecksum: string | null;
}): string {
  const payload = JSON.stringify({
    statusId: params.statusId,
    version: params.version,
    signedOffBy: params.signedOffBy,
    snapshot: canonicalize(params.snapshot),
    previousChecksum: params.previousChecksum ?? "GENESIS",
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Get the latest sign-off history entry for a statusId.
 * Returns the last version number and checksum for chaining.
 */
export async function getLastSignOffEntry<
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
>(
  db: ChainDb<TFullSchema, TSchema>,
  statusId: string,
): Promise<{ version: number; checksum: string } | null> {
  const rows = await db
    .select({ version: signOffHistory.version, checksum: signOffHistory.checksum })
    .from(signOffHistory)
    .where(eq(signOffHistory.statusId, statusId))
    .orderBy(desc(signOffHistory.version))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Verify the integrity of the sign-off chain for a given statusId.
 * Walks from version 1 to vN, recomputing each checksum and comparing.
 */
export async function verifySignOffChain<
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
>(
  db: ChainDb<TFullSchema, TSchema>,
  statusId: string,
): Promise<{ valid: boolean; brokenAtVersion: number | null }> {
  const entries = await db
    .select()
    .from(signOffHistory)
    .where(eq(signOffHistory.statusId, statusId))
    .orderBy(signOffHistory.version);

  if (entries.length === 0) return { valid: true, brokenAtVersion: null };

  for (const entry of entries) {
    const expected = computeChainedChecksum({
      statusId: entry.statusId,
      version: entry.version,
      signedOffBy: entry.signedOffBy,
      snapshot: entry.snapshot,
      previousChecksum: entry.previousChecksum,
    });

    if (expected !== entry.checksum) {
      return { valid: false, brokenAtVersion: entry.version };
    }
  }

  return { valid: true, brokenAtVersion: null };
}
