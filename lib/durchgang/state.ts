/**
 * Where each item of the Durchgang stands, from what the database already holds: the requirement
 * status row and the latest Durchgang event in the audit log. No column of its own.
 *
 * The status column is never written before the signature. "Filled in" lives only in the audit
 * event: the deadlines cron reads `needs_review` as "signed, review date passed" and the digest
 * mails on it, so borrowing that status would send review mails for items nobody has signed.
 */

import { z } from "zod";
import type { ItemState as PolicyState } from "@/lib/compliance/guided-form/policy";
import { resumeAt as policyResumeAt } from "@/lib/compliance/guided-form/policy";
import { hasSignOffToWithdraw } from "@/lib/compliance/sign-off-state";
import type { AuditLog, CompanyRequirementStatus } from "@/schema";

/** Why an item cannot be finished yet. Codes only: a free-text note goes to `internal_notes`. */
export const WAIT_REASONS = ["letter", "ask", "decide", "unclear"] as const;
export type WaitReason = (typeof WAIT_REASONS)[number];

/** The audit actions the flow writes, against the requirement status row. */
export const DURCHGANG_ACTIONS = [
  "durchgang.waiting",
  "durchgang.resumed",
  "durchgang.item_done",
] as const;

/**
 * The reason survives GDPR erasure, which redacts the erased person's name and email inside the
 * audit JSON: a code is neither. Should it still fail to parse, the item stays waiting and only
 * the reason is lost.
 */
const WAITING_VALUE = z.object({ reason: z.enum(WAIT_REASONS).nullable().catch(null) });

export type StatusRow = Pick<CompanyRequirementStatus, "status" | "signedOffAt">;
export type DurchgangEvent = Pick<AuditLog, "action" | "newValue" | "createdAt">;

export type ItemState =
  | { readonly kind: "open" }
  | { readonly kind: "waiting"; readonly reason: WaitReason | null; readonly since: Date }
  | { readonly kind: "filled"; readonly since: Date }
  | { readonly kind: "signed" }
  | { readonly kind: "not_applicable" };

/**
 * `latest` is the newest audit row with one of `DURCHGANG_ACTIONS` for this status row, or null.
 * An action outside that list reads as no event, so a caller that passes the wrong row cannot
 * make an item look finished.
 */
export function itemState(row: StatusRow, latest: DurchgangEvent | null): ItemState {
  if (row.status === "not_applicable") return { kind: "not_applicable" };
  if (hasSignOffToWithdraw(row)) return { kind: "signed" };
  switch (latest?.action) {
    case "durchgang.waiting":
      return {
        kind: "waiting",
        reason: WAITING_VALUE.safeParse(latest.newValue ?? {}).data?.reason ?? null,
        since: latest.createdAt,
      };
    case "durchgang.item_done":
      return { kind: "filled", since: latest.createdAt };
    default:
      return { kind: "open" };
  }
}

const POLICY_STATE: Readonly<Record<ItemState["kind"], PolicyState>> = {
  open: "open",
  waiting: "blocked",
  filled: "settled",
  signed: "settled",
  not_applicable: "settled",
};

/**
 * Where Continue goes: the first open item, else the first one waiting, else nowhere. A filled
 * item is finished for the person doing the work; the signature is the Geschäftsführung's step.
 */
export const resumeAt = <T>(
  items: readonly T[],
  stateOf: (item: T) => ItemState,
): T | null => policyResumeAt(items, (item) => POLICY_STATE[stateOf(item).kind]);
