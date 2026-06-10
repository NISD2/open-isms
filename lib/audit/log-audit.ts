import "@/lib/server-guard";
import { db } from "@/lib/db";
import {
  createLogAudit,
  type AuditDb,
  type AuditEntry,
} from "@nisd2/isms-trpc/audit";

export type { AuditEntry };

// `AuditDb` erases the schema generic. `createLogAudit` only calls
// `.insert(auditLog)` — which is identical at runtime across any
// NodePgDatabase<TSchema> — so the cast is safe today. If the factory
// ever uses `.query.X` (relational queries), revisit: those *do* depend
// on the schema generic.
export const logAudit = createLogAudit(db as unknown as AuditDb);
