import "@/lib/server-guard";
import { createHash } from "node:crypto";
import { type DbOrTx, db } from "@/lib/db";
import { auditLog } from "@/schema";
import { auditableInput } from "./audit-input";
import type { TestHolder } from "./context";

/**
 * Writes the rows that say who looked at what, and which application the operator allowed to sign
 * in. Unlike `logAudit`, which swallows a failed insert so a request is never lost to its own log,
 * these throw: a read that cannot be recorded is not made, and a sign-in that cannot be recorded is
 * not allowed. Under entity type `platformAdmin` and with no company, so no company's own log shows
 * them (server/trpc/routers/audit.ts). The checksum is the one `logAudit` computes.
 */
async function write(
  database: DbOrTx,
  row: {
    readonly action: string;
    readonly userId: string;
    readonly description: string;
    readonly newValue: Record<string, unknown>;
    readonly ip: string | null;
    readonly userAgent: string | null;
  },
): Promise<void> {
  const entry = {
    action: row.action,
    entityType: "platformAdmin",
    entityId: null,
    userId: row.userId,
    previousValue: undefined,
    newValue: row.newValue,
    ipAddress: row.ip,
    userAgent: row.userAgent,
    ts: new Date().toISOString(),
  };
  await database.insert(auditLog).values({
    companyId: null,
    userId: row.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: null,
    description: row.description,
    previousValue: null,
    newValue: entry.newValue,
    ipAddress: row.ip,
    userAgent: row.userAgent,
    checksum: createHash("sha256").update(JSON.stringify(entry)).digest("hex"),
  });
}

/**
 * A read: the input as `auditableInput` keeps it (ids, days, numbers, flags, and the length of any
 * text), never the answer.
 */
export const recordRead = (
  holder: TestHolder,
  tool: string,
  input: object,
): Promise<void> =>
  write(db, {
    action: "test.read",
    userId: holder.userId,
    description: `test: ${tool}`,
    newValue: { input: auditableInput(input), key: holder.keyId },
    ip: holder.ip,
    userAgent: holder.userAgent,
  });

/**
 * The operator allowed an application's browser sign-in: the name it gave itself and where the
 * browser went back to, as the consent card showed them. Never a code or a key.
 */
export const recordConnect = (
  database: DbOrTx,
  userId: string,
  connection: { readonly client: string | null; readonly returnHost: string },
  from: { readonly ip: string | null; readonly userAgent: string | null },
): Promise<void> =>
  write(database, {
    action: "test.connect",
    userId,
    description: `test: ${connection.client ?? "An application"}, back to ${connection.returnHost}`,
    newValue: { client: connection.client, returnHost: connection.returnHost },
    ip: from.ip,
    userAgent: from.userAgent,
  });
