import "@/lib/server-guard";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { auditLog } from "@/schema";
import { auditableInput } from "./audit-input";
import type { TestHolder } from "./context";

/**
 * Writes the row that says who looked at what. Unlike `logAudit`, which swallows a failed insert
 * so a request is never lost to its own log, this one throws: a read that cannot be recorded is
 * not made. Under entity type `platformAdmin` and with no company, so no company's own log shows
 * it (server/trpc/routers/audit.ts). The input is stored as `auditableInput` keeps it (ids, days,
 * numbers, flags, and the length of any text), never the answer. The checksum is the one
 * `logAudit` computes.
 */
export async function recordRead(
  holder: TestHolder,
  tool: string,
  input: object,
): Promise<void> {
  const entry = {
    action: "test.read",
    entityType: "platformAdmin",
    entityId: null,
    userId: holder.userId,
    previousValue: undefined,
    newValue: { input: auditableInput(input), key: holder.keyId },
    ipAddress: holder.ip,
    userAgent: holder.userAgent,
    ts: new Date().toISOString(),
  };
  await db.insert(auditLog).values({
    companyId: null,
    userId: holder.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: null,
    description: `test: ${tool}`,
    previousValue: null,
    newValue: entry.newValue,
    ipAddress: holder.ip,
    userAgent: holder.userAgent,
    checksum: createHash("sha256").update(JSON.stringify(entry)).digest("hex"),
  });
}
