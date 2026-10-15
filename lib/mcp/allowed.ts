import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { company } from "@/schema";

/**
 * Whether the company's admin has let its people connect AI assistants
 * (`company.assistants_allowed`). Read when a key is made or an assistant allowed, and on every
 * call an assistant makes, so turning it off stops every assistant at once.
 */
export async function assistantsAllowed(db: DbOrTx, companyId: string): Promise<boolean> {
  const row = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { assistantsAllowed: true },
  });
  return row?.assistantsAllowed === true;
}
