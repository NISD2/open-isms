import "@/lib/server-guard";
import { and, desc, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { auditLog } from "@/schema";
import { assistantOf } from "./agent";
import { type AssistantFill, FillRecord, ITEM_FILLED } from "./fills";

/**
 * The company's assistant fills of one requirement, newest first. A row that is not an
 * assistant's (its user agent says a person's browser) or whose record does not parse is left
 * out, so nothing a browser sends can mark a screen as an assistant's.
 */
export async function assistantFillsOf(
  db: DbOrTx,
  companyId: string,
  requirementId: string,
): Promise<readonly AssistantFill[]> {
  const rows = await db
    .select({
      userAgent: auditLog.userAgent,
      createdAt: auditLog.createdAt,
      newValue: auditLog.newValue,
    })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.companyId, companyId),
        eq(auditLog.action, ITEM_FILLED),
        eq(auditLog.entityType, "requirement"),
        eq(auditLog.entityId, requirementId),
      ),
    )
    .orderBy(desc(auditLog.createdAt));
  return rows.flatMap((row) => {
    const client = assistantOf(row.userAgent);
    const record = FillRecord.safeParse(row.newValue);
    return client && record.success
      ? [{ client, at: row.createdAt, record: record.data }]
      : [];
  });
}
