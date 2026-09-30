import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { companyRequirementStatus } from "@/schema";

/**
 * Lock one requirement status row for the rest of the transaction and return
 * what it holds now, or undefined if it does not exist.
 *
 * Lock order: a transaction that writes a requirement's status row and its
 * signer rows (requirement_assignment) takes the status row first. Signing,
 * reopening and saving answers once took the two in opposite orders, so a
 * reopen and a save of the same requirement could deadlock. Decisions that
 * depend on the row's state are made on what this returns, under the lock,
 * so a concurrent approval or sign-off cannot slip in after the check.
 */
export async function lockStatusRow(tx: DbOrTx, statusId: string) {
  const [row] = await tx
    .select({
      id: companyRequirementStatus.id,
      status: companyRequirementStatus.status,
      signedOffBy: companyRequirementStatus.signedOffBy,
      signedOffAt: companyRequirementStatus.signedOffAt,
    })
    .from(companyRequirementStatus)
    .where(eq(companyRequirementStatus.id, statusId))
    .for("update");
  return row;
}
