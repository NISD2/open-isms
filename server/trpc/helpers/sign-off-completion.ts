import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import { DEFAULT_SIGN_OFF_ROLE, type RoleKey } from "@/lib/compliance/role-keys";

/**
 * The role that must sign a requirement off. Requirements that do not name one
 * fall back to the platform default rather than accepting any signer.
 */
export function effectiveSignOffRole(requiredSignOffRole: string | null): RoleKey {
  return (requiredSignOffRole as RoleKey | null) ?? DEFAULT_SIGN_OFF_ROLE;
}

/**
 * Whether this signer may complete a requirement on their own.
 *
 * Admins bypass, matching the single sign-off path. The four sign-off entry
 * points share this predicate but react differently: the single-requirement
 * paths throw FORBIDDEN, because the caller asked for that specific row and
 * silence would look like success; the bulk paths filter the row out, because
 * a batch spans requirements with different required signers and one
 * unsignable row should not fail the rest. That difference is deliberate and
 * stays visible at each call site.
 */
export function signerMeetsRequiredRole(args: {
  sessionRole: string;
  /**
   * What the signer actually holds, from getSignerRole: their job title if
   * they set one, otherwise their session role. Deliberately a plain string,
   * not a RoleKey — job titles are user-entered free text, and the stored
   * `signed_off_role` column is varchar. Only the *required* side is a
   * closed set.
   */
  signerRole: string;
  requiredSignOffRole: string | null;
}): boolean {
  return (
    args.sessionRole === "admin" ||
    args.signerRole === effectiveSignOffRole(args.requiredSignOffRole)
  );
}

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
 * Not every terminal write is a sign-off. `updateRequirementStatus` moves a
 * requirement to completed without signing it, and intake derives progress
 * from saved answers without a signer. Those deliberately do not call this.
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
