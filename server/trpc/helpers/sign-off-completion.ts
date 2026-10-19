import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";

/**
 * The column values that mark a requirement signed off.
 *
 * This exists because every sign-off path wrote this set by hand and they had
 * drifted: bulkConfirmModuleRef omitted signedOffTemplateVersion, and the
 * intake path omitted both it and signOffSnapshot, so rows signed through
 * those carried nulls where the others recorded which version of the
 * requirement text was signed and what the company looked like at the time.
 * Going through one function makes that class of omission a type error
 * instead of a silent gap in the audit trail.
 *
 * No other path in the app writes completed: `updateRequirementStatus` sets only work
 * statuses and "not applicable", and saving intake answers moves rows back to
 * in progress, never forward.
 *
 * `now` is passed in rather than read here so every column on a row, and every
 * row in a batch, carries the same instant.
 */
export function completedSignOffValues(args: {
  userId: string;
  signedOffRole: string;
  templateVersion: number;
  snapshot: SignOffSnapshot;
  now: Date;
  /**
   * The terminal status to write. Intake treats approval as the sign-off act
   * and lands on "approved"; the assessment paths land on "completed".
   */
  status?: "completed" | "approved";
}) {
  return {
    status: args.status ?? ("completed" as const),
    completedAt: args.now,
    completedBy: args.userId,
    signedOffBy: args.userId,
    signedOffAt: args.now,
    signedOffRole: args.signedOffRole,
    signedOffTemplateVersion: args.templateVersion,
    signOffSnapshot: args.snapshot,
    updatedAt: args.now,
  };
}

/**
 * The column values that withdraw a sign-off and reopen the requirement.
 *
 * The exact mirror of {@link completedSignOffValues}: every evidentiary
 * column that function writes, this one clears. Keeping the pair adjacent is
 * the point — a column added to the sign-off set and forgotten here would
 * leave a reopened row still carrying half an attestation.
 *
 * `signedOffBy` is the load-bearing clear. It, not `signedOffAt`, is what
 * the rest of the system reads as "this is signed" (`lib/gdpr/erase-user.ts`
 * nulls the signer and keeps the timestamp, so the timestamp alone cannot be
 * trusted). `signOffSnapshot` matters nearly as much: `ReviewDashboard` and
 * `lib/pdf/compliance-report.tsx` gate their whole sign-off panel on it, so
 * a stale snapshot would keep rendering an attestation for a requirement
 * nobody currently vouches for.
 *
 * What this deliberately does NOT touch is `sign_off_history`. That chain is
 * append-only and tamper-evident; withdrawing an attestation is an event in
 * the record, not a deletion from it. An auditor should be able to see that
 * a requirement was signed and later reopened, and by whom.
 *
 * Reopening also restores applicability, because the same action undoes a
 * "not applicable" decision — that is one declaration to retract, not two.
 *
 * `nextReviewDate` is cleared here because the date described a sign-off that
 * no longer stands, and because the "not applicable" path sets it a year out.
 * Null is not the final answer for a *recurring* requirement, though: a
 * never-signed one carries an initial deadline from
 * `backfillInitialDeadlines`, so `reopenRequirement` recomputes that after
 * calling this. Kept out of here because it needs the assessment start date,
 * which would turn a pure column map into a query.
 */
export function reopenedSignOffValues(args: { now: Date }) {
  return {
    status: "in_progress" as const,
    completedAt: null,
    completedBy: null,
    signedOffBy: null,
    signedOffAt: null,
    signedOffRole: null,
    signedOffTemplateVersion: null,
    signOffSnapshot: null,
    isApplicable: true,
    notApplicableReason: null,
    notApplicableBy: null,
    notApplicableAt: null,
    nextReviewDate: null,
    updatedAt: args.now,
  };
}

/**
 * Re-stamp a batch snapshot for one requirement.
 *
 * The expensive half of a snapshot (company profile, asset and risk counts) is
 * company-scoped, so a batch builds it once. Only templateVersion varies per
 * requirement, and it has to: sign-off invalidation compares a bumped
 * requirement against `sign_off_snapshot->>'templateVersion'`, so a row
 * carrying a neighbour's version silently escapes review when its own
 * requirement text changes.
 */
export function snapshotForVersion(
  base: SignOffSnapshot,
  templateVersion: number,
): SignOffSnapshot {
  return { ...base, templateVersion };
}
