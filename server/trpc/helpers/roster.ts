import { and, inArray, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { requirementAssignment } from "@/schema";

/**
 * The status rows among these whose assigned signers still owe a signature: the SQL spelling of
 * pendingSignersOf in lib/compliance/sign-off-roster. A receipt from a past sign-off is not a
 * roster. Those rows are signed one by one through the assignment flow, never in a batch, never
 * by cross-framework credit and never set aside past the people still to sign.
 */
export async function rosteredOf(
  db: DbOrTx,
  statusIds: readonly string[],
): Promise<ReadonlySet<string>> {
  if (statusIds.length === 0) return new Set();
  const rows = await db
    .select({ statusId: requirementAssignment.statusId })
    .from(requirementAssignment)
    .where(
      and(
        inArray(requirementAssignment.statusId, [...statusIds]),
        isNull(requirementAssignment.signedOffAt),
      ),
    );
  return new Set(rows.map((a) => a.statusId));
}
