import { createHash } from "node:crypto";
import type { InferSelectModel } from "drizzle-orm";
import type { dataErasureLog } from "@/schema";

/** Recursively canonicalise: sort object keys, render Dates as ISO. Produces a
 *  stable serialisation independent of key order, so a jsonb column re-read
 *  from Postgres (which reorders keys) canonicalises identically. */
function sortValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const src = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(src)
        .sort()
        .map((k) => [k, sortValue(src[k])]),
    );
  }
  return value;
}

export function computeRecordChecksum(payload: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(sortValue(payload)))
    .digest("hex");
}

type ErasureLogRow = InferSelectModel<typeof dataErasureLog>;

/** Recompute the checksum from a stored row and compare. subjectEmail and the
 *  bookkeeping columns (id, createdAt, checksum) are excluded, matching what
 *  was hashed at write time, so the check survives retention-minimisation.
 *  The payload keys must mirror `logCore` in eraseUserInTx (erase-user.ts). */
export function verifyErasureRecord(row: ErasureLogRow): boolean {
  const payload = {
    caseRef: row.caseRef,
    subjectUserId: row.subjectUserId,
    subjectEmailHash: row.subjectEmailHash,
    subjectName: row.subjectName,
    companyId: row.companyId,
    companyName: row.companyName,
    requestReceivedAt: row.requestReceivedAt,
    requestChannel: row.requestChannel,
    rightsInvoked: row.rightsInvoked,
    legalBasis: row.legalBasis,
    erasedAt: row.erasedAt,
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    method: row.method,
    companyTornDown: row.companyTornDown,
    scope: row.scope,
    notes: row.notes,
    retentionUntil: row.retentionUntil,
  };
  return computeRecordChecksum(payload) === row.checksum;
}
