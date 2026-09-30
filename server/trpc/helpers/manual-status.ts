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

export type ManualStatusChange = { ok: true } | { ok: false; message: string };

/**
 * Whether a requirement in `current` may have its status changed by hand.
 *
 * An approved row carries a reviewer's approval next to the signer's
 * attestation. Overwriting its status erased the approval and left the
 * signature, snapshot and receipts in place, so the row read as in progress
 * with an attestation on it. `assessment.reopenRequirement` is the way out of
 * approved: it clears the signature with the status, and on an approved row
 * it needs review access (a reviewer or an admin).
 */
export function manualStatusChange(current: ItemStatus): ManualStatusChange {
  if (current === "approved") {
    return {
      ok: false,
      message:
        "This requirement was approved in review. It has to be reopened before its status can change.",
    };
  }
  return { ok: true };
}
