import type { StatusChange } from "@/lib/compliance/sign-off-state";
import type { itemStatusEnum } from "@/schema";

type ItemStatus = (typeof itemStatusEnum.enumValues)[number];

/**
 * The statuses a person may set by hand through
 * `assessment.updateRequirementStatus`.
 *
 * `completed` is left out: a requirement is done only when someone holding its
 * role signs it (`assessment.signOff`), never by setting a status. Neither is
 * `needs_review`, which only the deadline cron and the module recheck write,
 * when something already signed is due to be looked at again, nor `approved`
 * and `rejected`, a reviewer's decisions (review.ts).
 */
export const MANUAL_STATUSES = [
  "not_started",
  "in_progress",
  "not_applicable",
] as const satisfies readonly ItemStatus[];

/** The hand-set statuses that record no decision, so they need no reason and no signer. */
export const WORK_STATUSES = [
  "not_started",
  "in_progress",
] as const satisfies readonly Exclude<
  (typeof MANUAL_STATUSES)[number],
  "not_applicable"
>[];

/**
 * The refusal for any change that would take an approved requirement out of
 * approved without going through `assessment.reopenRequirement`, which clears
 * the signature with the status and needs review access on an approved row.
 */
export const REOPEN_APPROVED_FIRST =
  "This requirement was approved in review. It has to be reopened before its status can change.";

/**
 * The refusal for a hand-set status on a row that carries a sign-off or a
 * decision not to do it. Setting a status over it would leave a signature on a
 * row whose status says otherwise; `assessment.reopenRequirement` withdraws it
 * first.
 */
export const REOPEN_SIGNED_FIRST =
  "This requirement is signed off or set aside. It has to be reopened before its status can change.";

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
