/**
 * What a membership role may do, apart from the sign-in itself (./config), so code that only
 * asks about a role does not load Auth.js and the env it validates.
 */

/** Roles that can access the review dashboard and approve/reject submissions. */
export function hasReviewAccess(role: string): boolean {
  return role === "admin" || role === "reviewer" || role === "legal_reviewer";
}

/** Roles that should see forms as read-only (reviewers, not admins). */
export function isReviewerRole(role: string): boolean {
  return role === "reviewer" || role === "legal_reviewer";
}
