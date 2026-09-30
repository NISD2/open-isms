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

export type StatusChange = { ok: true } | { ok: false; message: string };

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
    return { ok: false, message: REOPEN_APPROVED_FIRST };
  }
  return { ok: true };
}
