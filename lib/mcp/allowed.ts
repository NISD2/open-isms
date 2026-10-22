import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { company } from "@/schema";

/** What the company's admin has let assistants do, read in one query. */
export interface AssistantRights {
  /** `company.assistants_allowed`: whether its people may connect assistants at all. */
  readonly allowed: boolean;
  /** `company.assistants_read_records`: whether those assistants may also read the records. */
  readonly readRecords: boolean;
}

/**
 * What the company's admin has let assistants do. Read when a key is made or an assistant allowed,
 * and on every call an assistant makes, so turning either off stops it at once. Reading the
 * records needs both: assistants turned off read nothing, whatever the second switch held.
 */
export async function assistantRights(
  db: DbOrTx,
  companyId: string,
): Promise<AssistantRights> {
  const row = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { assistantsAllowed: true, assistantsReadRecords: true },
  });
  const allowed = row?.assistantsAllowed === true;
  return { allowed, readRecords: allowed && row?.assistantsReadRecords === true };
}

/** Whether the company's admin has let its people connect AI assistants. */
export async function assistantsAllowed(db: DbOrTx, companyId: string): Promise<boolean> {
  return (await assistantRights(db, companyId)).allowed;
}
