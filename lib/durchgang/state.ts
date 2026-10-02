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
import type { AuditLog, CompanyRequirementStatus } from "@/schema/types";

/** Why an item cannot be finished yet. Codes only: a free-text note goes to `internal_notes`. */
export const WAIT_REASONS = ["letter", "ask", "decide", "unclear"] as const;
export type WaitReason = (typeof WAIT_REASONS)[number];

/**
 * The audit actions that move an item. They are logged the way `announceWithdrawal` logs a
 * withdrawn sign-off: entity type "requirement", the requirement's id and the company. One query
 * then finds both.
 */
export const DURCHGANG_ACTIONS = [
  "durchgang.waiting",
  "durchgang.resumed",
  "durchgang.item_done",
  "durchgang.declined",
] as const;

/** The audit actions that record what a screen did, without moving the item. */
const RECORD_ACTIONS = [
  "durchgang.adopted",
  "durchgang.agreements",
  "durchgang.logins",
  "durchgang.backups",
  "durchgang.crypto_adopted",
  "durchgang.policies_approved",
  "durchgang.requirements_signed",
  "durchgang.critical",
] as const;

/** Every audit action the walk writes, so a misspelt one fails the build, not the walk's state. */
export type DurchgangAction =
  | (typeof DURCHGANG_ACTIONS)[number]
  | (typeof RECORD_ACTIONS)[number];

/**
 * Every action that moves an item: the ones the query picking `latest` reads. A withdrawn
 * sign-off (a reopen, or an intake save on a signed item) puts the item back in progress, so a
 * "filled" from before it must not survive it.
 */
export const STATE_ACTIONS = [
  ...DURCHGANG_ACTIONS,
  "requirement.sign_off_withdrawn",
] as const;

/**
 * The reason survives GDPR erasure, which redacts the erased person's name and email inside the
 * audit JSON: a code is neither. Should it still fail to parse, the item stays waiting and only
 * the reason is lost.
 */
const WAITING_VALUE = z.object({ reason: z.enum(WAIT_REASONS).nullable().catch(null) });

export type StatusRow = Pick<
  CompanyRequirementStatus,
  "status" | "signedOffAt" | "reviewedAt"
>;
export type DurchgangEvent = Pick<AuditLog, "action" | "newValue" | "createdAt">;

export type ItemState =
  | { readonly kind: "open" }
  | { readonly kind: "waiting"; readonly reason: WaitReason | null; readonly since: Date }
  | { readonly kind: "filled"; readonly since: Date }
  /**
   * The company decided not to do this, with a written reason in the notes trail for the
   * Geschäftsführung to sign. Finished for the walk, like "filled".
   */
  | { readonly kind: "declined"; readonly since: Date }
  | { readonly kind: "signed" }
  | { readonly kind: "not_applicable" };

/**
 * `latest` is the company's newest audit row for this requirement with one of `STATE_ACTIONS`,
 * or null. Any other action reads as no event, so a caller that passes the wrong row cannot make
 * an item look finished.
 *
 * A rejection is read before the signature: `review.reject` keeps `signedOffAt` and writes no
 * audit row, so its only trace is the status and `reviewedAt`. Work in the flow counts only when
 * it provably came after the rejection.
 *
 * `needs_review` is a signed item that has to be signed again: its review date passed (the
 * deadlines cron) or the register behind it changed (the module recheck). Both keep the old
 * signature, so it is read before the signature too: filled in and waiting for management,
 * unless the walk set it aside or declined it after that signature.
 */
export function itemState(row: StatusRow, latest: DurchgangEvent | null): ItemState {
  if (row.status === "not_applicable") return { kind: "not_applicable" };
  if (row.status === "rejected") {
    const { reviewedAt } = row;
    return fromEvent(
      latest && reviewedAt && latest.createdAt > reviewedAt ? latest : null,
    );
  }
  if (row.status === "needs_review" && row.signedOffAt) {
    const { signedOffAt } = row;
    const after = fromEvent(latest && latest.createdAt > signedOffAt ? latest : null);
    return after.kind === "open" ? { kind: "filled", since: signedOffAt } : after;
  }
  if (hasSignOffToWithdraw(row)) return { kind: "signed" };
  return fromEvent(latest);
}

function fromEvent(latest: DurchgangEvent | null): ItemState {
  switch (latest?.action) {
    case "durchgang.waiting":
      return {
        kind: "waiting",
        reason: WAITING_VALUE.safeParse(latest.newValue ?? {}).data?.reason ?? null,
        since: latest.createdAt,
      };
    case "durchgang.item_done":
      return { kind: "filled", since: latest.createdAt };
    case "durchgang.declined":
      return { kind: "declined", since: latest.createdAt };
    default:
      return { kind: "open" };
  }
}

/**
 * The items waiting for management's signature, in walk order, each with the drafts of the
 * documents it wrote: an item is signed only once its documents are approved. Filled in counts,
 * and so does a signed item that has to be signed again (see `itemState`).
 *
 * The item that holds the approval counts once its review is recorded (`reviewedWithinYear`).
 * The approval is that item's own last working step, so the item can only be finished after it,
 * and its review screen lets nobody on without such a review.
 */
export function awaitingSignature<T>(args: {
  readonly codes: readonly string[];
  readonly stateOf: (code: string) => ItemState;
  readonly drafts: ReadonlyArray<{ readonly code: string; readonly type: T }>;
  readonly approvalCode: string | null;
  readonly reviewed: boolean;
}): Array<{ code: string; drafts: T[] }> {
  return args.codes.flatMap((code) => {
    const { kind } = args.stateOf(code);
    const approving = code === args.approvalCode && kind === "open" && args.reviewed;
    if (kind !== "filled" && !approving) return [];
    const drafts = args.drafts.filter((d) => d.code === code).map((d) => d.type);
    return [{ code, drafts }];
  });
}

/**
 * What counts as finished for signing the approval item last: signed off, not applicable, or
 * decided not to do. Nothing signs a decline, so a decline must not hold the review back (Simon,
 * 03.10.2026).
 */
const FINISHED_BEFORE_REVIEW: ReadonlySet<ItemState["kind"]> = new Set([
  "signed",
  "not_applicable",
  "declined",
]);

/**
 * The item that holds the approval, the management review, is signed last: only in an approval
 * that leaves every other walk item finished once it has signed `batch`. Until then it stays
 * filled in and waiting for management. Simon, 03.10.2026: "the record management review should
 * never be done until everything's signed off".
 */
export function signLast<T extends { readonly code: string }>(
  batch: readonly T[],
  args: {
    readonly codes: readonly string[];
    readonly stateOf: (code: string) => ItemState;
    readonly approvalCode: string | null;
  },
): T[] {
  const { approvalCode } = args;
  if (!approvalCode) return [...batch];
  const signing = new Set(batch.map((item) => item.code));
  const othersFinished = args.codes.every(
    (code) =>
      code === approvalCode ||
      signing.has(code) ||
      FINISHED_BEFORE_REVIEW.has(args.stateOf(code).kind),
  );
  return othersFinished ? [...batch] : batch.filter((item) => item.code !== approvalCode);
}

/**
 * Whether the company's management reviews include one that counts for the approval: dated
 * within the last year up to today, the cycle the management review runs on. `days` and `today`
 * are calendar days in Berlin as ISO dates (`recordDay`), which compare as text. The review
 * screen and the approval read this one rule.
 */
export function reviewedWithinYear(days: readonly string[], today: string): boolean {
  const day = new Date(`${today}T00:00:00Z`);
  const year = day.getUTCFullYear() - 1;
  const month = day.getUTCMonth();
  // 29 February a year back is the 28th, not 1 March.
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const yearAgo = new Date(Date.UTC(year, month, Math.min(day.getUTCDate(), lastOfMonth)))
    .toISOString()
    .slice(0, 10);
  return days.some((d) => d >= yearAgo && d <= today);
}

const POLICY_STATE: Readonly<Record<ItemState["kind"], PolicyState>> = {
  open: "open",
  waiting: "blocked",
  filled: "settled",
  declined: "settled",
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
