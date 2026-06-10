import { createHash } from "node:crypto";
import { auditLog } from "@nisd2/isms-schema/tables/audit-log";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface AuditEntry {
  companyId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type AuditDb = NodePgDatabase<Record<string, never>>;

export function createLogAudit(db: AuditDb) {
  return async function logAudit(entry: AuditEntry): Promise<void> {
    const checksum = computeChecksum(entry);
    try {
      await db.insert(auditLog).values({
        companyId: entry.companyId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        previousValue: entry.previousValue ?? null,
        newValue: entry.newValue ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        checksum,
      });
    } catch (err) {
      // Audit B-3 (2026-06-10): catch + log at the source instead of
      // letting fire-and-forget callers swallow rejections silently.
      // Cron / middleware / router callers all funnel through here, so
      // wrapping once eliminates the "no audit row, no error" failure
      // mode for every caller in one change. Sign-off integrity does
      // NOT rely on this log call — that's the chained sign_off_history
      // table (`recordSignOffChainEntry`), written inside the mutation's
      // own transaction. The audit_log row is the "user did action X"
      // trail; losing it surfaces here rather than disappearing.
      console.error("[audit] failed to write audit_log row", {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };
}

function computeChecksum(entry: AuditEntry): string {
  const payload = JSON.stringify({
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    userId: entry.userId,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
    ts: new Date().toISOString(),
  });
  return createHash("sha256").update(payload).digest("hex");
}
