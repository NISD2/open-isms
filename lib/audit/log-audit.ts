import "@/lib/server-guard";
import { type AuditDb, type AuditEntry, createLogAudit } from "@nisd2/isms-trpc/audit";
import { db } from "@/lib/db";
import { viaOf } from "@/lib/mcp/agent";

export type { AuditEntry };

// `AuditDb` erases the schema generic. `createLogAudit` only calls
// `.insert(auditLog)` — which is identical at runtime across any
// NodePgDatabase<TSchema> — so the cast is safe today. If the factory
// ever uses `.query.X` (relational queries), revisit: those *do* depend
// on the schema generic.
const writeAudit = createLogAudit(db as unknown as AuditDb);

/**
 * Every audit row the app writes, with `via` decided here once: the tRPC middleware's automatic
 * rows, the procedures' own rows and the MCP tools' rows all carry the request's user agent, so
 * no caller has to remember it.
 */
export const logAudit = (entry: AuditEntry): Promise<void> =>
  writeAudit({ ...entry, via: viaOf(entry.userAgent ?? null) });
