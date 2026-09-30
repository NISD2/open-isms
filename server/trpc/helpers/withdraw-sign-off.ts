import { and, eq, inArray, isNotNull, ne, notInArray } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import {
  computeInitialDeadline,
  type Frequency,
  isRecurringFrequency,
  type Priority,
  toDateString,
} from "@/lib/compliance/deadlines";
import { buildRequirementLink } from "@/lib/compliance/schedule-notifications";
import type { Database, DbOrTx } from "@/lib/db";
import {
  companyMembership,
  companyRequirementStatus,
  notification,
  requirementAssignment,
} from "@/schema";
import { reopenedSignOffValues } from "./sign-off-completion";

/**
 * Withdrawing a sign-off and putting the requirement back in progress. Two
 * paths do it, `assessment.reopenRequirement` and an intake save on a signed
 * requirement, and both come through here so a withdrawal always clears the
 * same things and tells the same people.
 */

/**
 * The deadline a never-signed row of this requirement would carry.
 *
 * Reopening clears `nextReviewDate` because that date described a sign-off
 * that no longer stands. Leaving it null would be wrong in the other
 * direction: `backfillInitialDeadlines` gives every *recurring* requirement an
 * initial deadline at assessment creation, so a reopened one with none
 * silently drops out of the journey board's overdue and due-soon filters —
 * 35 of the 49 NIS 2 requirements are recurring. Non-recurring ones
 * legitimately carry no date; `scheduleDeadlineReminders` nulls theirs on
 * sign-off for the same reason.
 */
export function reopenedReviewDate(args: {
  assessmentStartedAt: Date | null;
  frequency: string;
  priority: string;
}): string | null {
  const frequency = args.frequency as Frequency;
  return args.assessmentStartedAt && isRecurringFrequency(frequency)
    ? toDateString(
        computeInitialDeadline(args.assessmentStartedAt, args.priority as Priority),
      )
    : null;
}

/**
 * Withdraw one requirement's sign-off inside the caller's transaction.
 *
 * Returns the reopened row, and the people whose signature was withdrawn who
 * are still members, other than whoever is withdrawing it (they know).
 */
export async function withdrawSignOff(
  tx: DbOrTx,
  args: {
    statusId: string;
    companyId: string;
    actorId: string;
    nextReviewDate: string | null;
    now: Date;
  },
) {
  const memberIds = () =>
    tx
      .select({ userId: companyMembership.userId })
      .from(companyMembership)
      .where(eq(companyMembership.companyId, args.companyId));

  // Read before the clear below erases who had signed.
  const losingSignature = await tx
    .select({ userId: requirementAssignment.userId })
    .from(requirementAssignment)
    .where(
      and(
        eq(requirementAssignment.statusId, args.statusId),
        isNotNull(requirementAssignment.signedOffAt),
        ne(requirementAssignment.userId, args.actorId),
        inArray(requirementAssignment.userId, memberIds()),
      ),
    );

  // A receipt from someone removed from the company since they signed would
  // become a roster entry nobody can clear once reset below, and block the
  // requirement for good. Its signature is withdrawn here anyway, so the row
  // goes instead.
  await tx
    .delete(requirementAssignment)
    .where(
      and(
        eq(requirementAssignment.statusId, args.statusId),
        notInArray(requirementAssignment.userId, memberIds()),
      ),
    );

  // Clearing the per-signer rows is what makes reopening honest for an N-of-M
  // requirement. Left signed, the next single signature would close the
  // requirement again with M-1 stale attestations behind it.
  await tx
    .update(requirementAssignment)
    .set({ signedOffAt: null, signedOffRole: null })
    .where(eq(requirementAssignment.statusId, args.statusId));

  const [row] = await tx
    .update(companyRequirementStatus)
    .set({
      ...reopenedSignOffValues({ now: args.now }),
      nextReviewDate: args.nextReviewDate,
    })
    .where(eq(companyRequirementStatus.id, args.statusId))
    .returning();

  return { row, losingSignature: losingSignature.map((r) => r.userId) };
}

/**
 * Tell the people whose signature was withdrawn, and record the withdrawal.
 * Call after the transaction that withdrew it has committed. Fire-and-forget:
 * neither write may fail the action that caused it.
 *
 * Withdrawing deletes somebody else's attestation, and it used to do so
 * silently. `review.ts` notifies the submitter on both approve and reject, so
 * the precedent for "we changed the standing of your work, here is why"
 * already exists; an erased signature is at least as worth knowing about.
 *
 * `sign_off_history` is untouched by design. The chain is append-only and
 * tamper-evident; the record that this was signed and later withdrawn is
 * exactly what an auditor needs, and the audit_log entry carries the
 * withdrawal itself.
 */
export function announceWithdrawal(
  db: Database,
  args: {
    companyId: string;
    actorId: string;
    requirement: { id: string; code: string; categoryId: string };
    previous: {
      status: string;
      signedOffBy: string | null;
      signedOffAt: Date | null;
    };
    newStatus: string;
    losingSignature: readonly string[];
    now: Date;
  },
): void {
  const { requirement } = args;

  if (args.losingSignature.length > 0) {
    buildRequirementLink(db, requirement.categoryId, requirement.code)
      .then((linkUrl) =>
        db.insert(notification).values(
          args.losingSignature.map((userId) => ({
            companyId: args.companyId,
            recipientId: userId,
            entityType: "requirement",
            entityId: requirement.id,
            triggerField: "signedOffAt",
            subject: `Sign-off withdrawn: ${requirement.code}`,
            body:
              `Your sign-off on requirement ${requirement.code} was withdrawn, ` +
              `and the requirement is open for editing again. It needs signing off once ` +
              `the work is finished.`,
            channel: "in_app" as const,
            scheduledFor: args.now,
            urgency: "warning" as const,
            linkUrl,
          })),
        ),
      )
      .catch((err) => console.error("[notify] sign-off withdrawn:", err));
  }

  logAudit({
    companyId: args.companyId,
    userId: args.actorId,
    action: "requirement.sign_off_withdrawn",
    entityType: "requirement",
    entityId: requirement.id,
    description: `${requirement.code} reopened from ${args.previous.status}`,
    previousValue: args.previous,
    newValue: { status: args.newStatus },
  }).catch((err) => console.error("[audit] sign-off withdrawn:", err));
}
