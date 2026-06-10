/**
 * Sign-off history — chain-write helpers.
 *
 * Every path that writes `companyRequirementStatus.signOffSnapshot` MUST
 * also append a row to `sign_off_history` inside the same transaction.
 * Otherwise the chain is a no-op (audit B-2, 2026-06-10): for any status
 * with zero history rows `verifySignOffChain` short-circuits to
 * `{valid: true}`, so the integrity check never sees the tampering it was
 * built to detect.
 *
 * Call sites all pass through `recordSignOffChainEntry` so the snapshot
 * shape and checksum chain stay consistent. Direct inserts into
 * `signOffHistory` outside this helper are a smell.
 */

import { eq } from "drizzle-orm";
import {
  computeChainedChecksum,
  getLastSignOffEntry,
  type ChainDb,
} from "@nisd2/isms-trpc/audit";
import type { SignOffSnapshotData } from "@nisd2/isms-schema/tables/sign-off-history";
import { signOffHistory, evidence } from "@/schema";
import type { Database } from "@/lib/db";

/**
 * Inputs for appending a sign-off chain entry. The snapshot's `data` field
 * is left optional — call sites populate it with the structured payload
 * canonical at sign-off time (intake answers, editor body) or leave it
 * empty when the sign-off is a pure status transition (module confirm).
 */
export interface RecordSignOffParams {
  companyId: string;
  statusId: string;
  requirementId: string;
  signedOffBy: string;
  signedOffRole: string;
  source: SignOffSnapshotData["source"];
  templateVersion: number;
  companyProfile: Record<string, unknown>;
  data?: Record<string, unknown>;
}

/**
 * Append a chained-checksum entry to `sign_off_history` for the given
 * status. Reads the chain head, computes `version = (last?.version ?? 0)
 * + 1`, hashes the canonicalised payload, and inserts one row. Replay of a
 * sign-off produces version N+1 — never an in-place mutation of version
 * N — so deletions and reorderings of the chain are detected by the
 * checksum mismatch in `verifySignOffChain`.
 *
 * MUST be called inside the same transaction as the `companyRequirement
 * Status` update so a partial commit cannot leave the chain and the
 * status row in disagreement.
 *
 * `Database` is passed for type ergonomics; at runtime the helper only
 * uses raw SQL builders so a `PgTransaction` is structurally compatible.
 * The cast in `getLastSignOffEntry` is documented as safe by the package.
 */
export async function recordSignOffChainEntry(
  db: Database,
  params: RecordSignOffParams,
): Promise<void> {
  const chainDb = db as unknown as ChainDb;

  const evidenceRows = await db.query.evidence.findMany({
    where: eq(evidence.requirementStatusId, params.statusId),
    columns: { id: true, fileName: true, contentHash: true, version: true },
  });

  const snapshot: SignOffSnapshotData = {
    source: params.source,
    templateVersion: params.templateVersion,
    companyProfile: params.companyProfile,
    data: params.data ?? {},
    evidenceRefs: evidenceRows.map((e) => ({
      id: e.id,
      fileName: e.fileName,
      contentHash: e.contentHash,
      version: e.version,
    })),
  };

  const last = await getLastSignOffEntry(chainDb, params.statusId);
  const version = (last?.version ?? 0) + 1;
  const previousChecksum = last?.checksum ?? null;
  const checksum = computeChainedChecksum({
    statusId: params.statusId,
    version,
    signedOffBy: params.signedOffBy,
    snapshot,
    previousChecksum,
  });

  await db.insert(signOffHistory).values({
    companyId: params.companyId,
    statusId: params.statusId,
    requirementId: params.requirementId,
    version,
    signedOffBy: params.signedOffBy,
    signedOffRole: params.signedOffRole,
    snapshot,
    checksum,
    previousChecksum,
  });
}
