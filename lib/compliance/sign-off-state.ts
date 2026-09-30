/**
 * Whether a requirement row still carries a sign-off, and who may withdraw it.
 *
 * Kept in lib/compliance, next to sign-off-roster.ts and for the same reason:
 * `assessment.reopenRequirement` and the intake save enforce this rule, and
 * the requirement page reads it to choose between offering Sign off and
 * offering Reopen. Two copies disagreed once already: the page decided by
 * status name and offered a fresh sign-off on a needs_review row whose old
 * signature the server still counted.
 */

import { DONE_STATUSES } from "./journey-position";

/**
 * The shape both sides share. The timestamp is `Date` off a drizzle row and a
 * string once it has been through the server-component boundary; the rule only
 * asks whether it exists.
 */
export type SignOffState = { status: string; signedOffAt: Date | string | null };

export type StatusChange =
  | { ok: true }
  | { ok: false; code: "BAD_REQUEST" | "FORBIDDEN"; message: string };

/**
 * Whether a row carries a sign-off that putting it back in progress has to
 * withdraw: a done status, or a signature on it whatever its status says.
 *
 * Deciding by status name alone missed needs_review. The module recheck moves
 * a signed requirement there and keeps its signature, snapshot and signer
 * receipts, so a save put it in progress with the attestation still on it and
 * the next single signature closed it on the old ones. `signedOffAt` rather
 * than `signedOffBy`, because erasing a user nulls the signer and keeps the
 * time, and that row still carries a sign-off.
 */
export function hasSignOffToWithdraw(row: SignOffState): boolean {
  return DONE_STATUSES.has(row.status) || row.signedOffAt !== null;
}

/**
 * Whether `assessment.reopenRequirement` may reopen this row. The server
 * decides on the row as locked inside its transaction. An approved row needs
 * review access: a member undoing their own attestation is ordinary work, a
 * member erasing a reviewer's approval is not.
 */
export function reopenChange(row: SignOffState, reviewAccess: boolean): StatusChange {
  if (!hasSignOffToWithdraw(row)) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      message: `Requirement is ${row.status} and has nothing to reopen.`,
    };
  }
  if (row.status === "approved" && !reviewAccess) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "This requirement was approved in review. Only a reviewer can reopen it.",
    };
  }
  return { ok: true };
}
