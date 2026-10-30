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

import type { SignOffSnapshotData } from "@nisd2/isms-schema/tables/sign-off-history";
import { computeChainedChecksum, getLastSignOffEntry } from "@nisd2/isms-trpc/audit";
import { desc, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { evidence, signOffHistory, user } from "@/schema";
import { signedWording } from "./signed-wording";

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
  signerName?: string | null;
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
 * The entry carries the requirement's wording as the signer read it (signedWording), so the
 * chain proves what was signed, not only that something was.
 */
export async function recordSignOffChainEntry(
  db: DbOrTx,
  params: RecordSignOffParams,
): Promise<void> {
  const [evidenceRows, requirement, signer] = await Promise.all([
    db.query.evidence.findMany({
      where: eq(evidence.requirementStatusId, params.statusId),
      columns: { id: true, fileName: true, contentHash: true, version: true },
    }),
    signedWording(db, {
      requirementId: params.requirementId,
      signerId: params.signedOffBy,
      companyId: params.companyId,
    }),
    params.signerName !== undefined
      ? Promise.resolve(null)
      : db.query?.user?.findFirst
        ? db.query.user.findFirst({
            where: eq(user.id, params.signedOffBy),
            columns: { name: true },
          })
        : Promise.resolve(null),
  ]);

  const signerName =
    params.signerName !== undefined ? params.signerName : (signer?.name ?? null);

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
    requirement,
    ...(signerName ? { signerName } : {}),
  };

  const last = await getLastSignOffEntry(db, params.statusId);
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

/**
 * Load the latest sign-off history snapshots for a set of status IDs.
 * Newest first, so each status maps to its latest sign-off snapshot.
 */
export async function latestSignOffSnapshots(
  db: DbOrTx,
  statusIds: readonly string[],
): Promise<Map<string, SignOffSnapshotData>> {
  if (statusIds.length === 0) return new Map();
  const rows = await db
    .select({ statusId: signOffHistory.statusId, snapshot: signOffHistory.snapshot })
    .from(signOffHistory)
    .where(inArray(signOffHistory.statusId, [...statusIds]))
    .orderBy(desc(signOffHistory.version));

  const result = new Map<string, SignOffSnapshotData>();
  for (const row of rows) {
    if (!result.has(row.statusId)) {
      result.set(row.statusId, row.snapshot);
    }
  }
  return result;
}
