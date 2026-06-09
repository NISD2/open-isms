import { createHash } from "node:crypto";
import { eq, desc } from "drizzle-orm";
import { signOffHistory } from "@nisd2/isms-schema/tables/sign-off-history";
import type { SignOffSnapshotData } from "@nisd2/isms-schema/tables/sign-off-history";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Database parameter accepted by the chain helpers. Uses raw SQL builders
 * only (select/where/orderBy/limit), so the schema generic is irrelevant —
 * any NodePgDatabase or transaction is structurally compatible.
 */
export type ChainDb = NodePgDatabase<Record<string, never>>;

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
export async function getLastSignOffEntry(
  db: ChainDb,
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
export async function verifySignOffChain(
  db: ChainDb,
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
