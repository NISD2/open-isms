/**
 * Who may sign a requirement off. Shared by the server, which enforces it on every sign-off and
 * "not applicable", and the requirement page, which reads it so it never offers what the server
 * refuses. Client-safe: no schema or database imports.
 */

import { MANAGEMENT_ROLE } from "@/lib/durchgang/types";
import { DEFAULT_SIGN_OFF_ROLE, type RoleKey } from "./role-keys";

/**
 * The role stamped on a sign-off: the signer's compliance role in the company they have open,
 * falling back to their membership role. Both come from the session, which resolves the open
 * company's membership on every request.
 */
export function signerRoleOf(session: { jobTitle: string | null; role: string }): string {
  return session.jobTitle ?? session.role;
}

/**
 * The role that must sign a requirement off. Requirements that do not name one
 * fall back to the platform default rather than accepting any signer.
 */
export function effectiveSignOffRole(requiredSignOffRole: string | null): RoleKey {
  return (requiredSignOffRole as RoleKey | null) ?? DEFAULT_SIGN_OFF_ROLE;
}

/**
 * Whether this signer may complete a requirement: they hold the role it names,
 * or they are management, who may sign anything (§ 38 Abs. 1 BSIG has
 * management implement and oversee the measures).
 *
 * Being an admin is no role here. Admin is what an account may manage in the
 * app; a signature records who answers for a requirement, so an admin without
 * the role signing in its place would put a name on the record that the
 * requirement does not ask for. An assigned signer is held to the same rule:
 * being on a requirement's roster says who signs, not that they may.
 *
 * The sign-off entry points share this predicate but react differently: the
 * single-requirement paths throw FORBIDDEN, because the caller asked for that
 * specific row and silence would look like success; the bulk paths filter the
 * row out, because a batch spans requirements with different required signers
 * and one unsignable row should not fail the rest. That difference is
 * deliberate and stays visible at each call site.
 */
export function signerMeetsRequiredRole(args: {
  /**
   * What the signer actually holds (signerRoleOf): their job title if they set
   * one, otherwise their membership role. Deliberately a plain string, not a
   * RoleKey: the stored `signed_off_role` column is varchar. Only the
   * *required* side is a closed set.
   */
  signerRole: string;
  requiredSignOffRole: string | null;
}): boolean {
  return (
    args.signerRole === MANAGEMENT_ROLE ||
    args.signerRole === effectiveSignOffRole(args.requiredSignOffRole)
  );
}

/** What a caller who fails `signerMeetsRequiredRole` on a single requirement is told. */
export function requiredRoleRefusal(requiredSignOffRole: string | null): string {
  return `This requirement requires sign-off by ${effectiveSignOffRole(requiredSignOffRole).toUpperCase()} or management.`;
}
