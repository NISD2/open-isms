import { DONE_STATUSES } from "@/lib/compliance/journey-position";
import type { itemStatusEnum } from "@/schema";

type ItemStatus = (typeof itemStatusEnum.enumValues)[number];

/**
 * The statuses a person may set by hand through
 * `assessment.updateRequirementStatus`.
 *
 * `needs_review` is left out because only the deadline cron and the module
 * recheck write it, when something already signed is due to be looked at
 * again. `approved` and `rejected` are a reviewer's decisions (review.ts).
 */
export const MANUAL_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "not_applicable",
] as const satisfies readonly ItemStatus[];

/**
 * The refusal for any change that would take an approved requirement out of
 * approved without going through `assessment.reopenRequirement`, which clears
 * the signature with the status and needs review access on an approved row.
 */
export const REOPEN_APPROVED_FIRST =
  "This requirement was approved in review. It has to be reopened before its status can change.";

export type StatusChange =
  | { ok: true }
  | { ok: false; code: "BAD_REQUEST" | "FORBIDDEN"; message: string };

type SignedState = { status: ItemStatus; signedOffAt: Date | null };

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
export function hasSignOffToWithdraw(row: SignedState): boolean {
  return DONE_STATUSES.has(row.status) || row.signedOffAt !== null;
}

/**
 * Whether `assessment.reopenRequirement` may reopen this row, decided on the
 * row as locked inside its transaction. An approved row needs review access:
 * a member undoing their own attestation is ordinary work, a member erasing
 * a reviewer's approval is not.
 */
export function reopenChange(row: SignedState, reviewAccess: boolean): StatusChange {
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

/**
 * Whether saving intake answers may move these requirement rows back to in
 * progress.
 *
 * A save reopens the rows it covers, which on an approved row erases the
 * reviewer's approval. That is what reopening does, so it takes what
 * reopening takes: review access (a reviewer or an admin). Everyone else
 * could otherwise undo an approval by pressing Save.
 */
export function answerSaveChange(
  statuses: readonly ItemStatus[],
  reviewAccess: boolean,
): StatusChange {
  if (!reviewAccess && statuses.includes("approved")) {
    return { ok: false, code: "FORBIDDEN", message: REOPEN_APPROVED_FIRST };
  }
  return { ok: true };
}
