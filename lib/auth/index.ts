export { handlers, auth, signIn, signOut, getSession } from "./config";

/** Roles that can access the review dashboard and approve/reject submissions. */
export function hasReviewAccess(role: string): boolean {
  return role === "admin" || role === "reviewer" || role === "legal_reviewer";
}

/** Roles that should see forms as read-only (reviewers, not admins). */
export function isReviewerRole(role: string): boolean {
  return role === "reviewer" || role === "legal_reviewer";
}
