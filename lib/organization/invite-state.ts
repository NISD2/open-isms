/**
 * Where a team invite stands, decided once for every reader: the accept page, the team page's
 * pending list, the procedures that send and renew invites, and the platform admin's list.
 */

/** An invite stops working at the instant it expires. */
export const isInviteExpired = (expiresAt: Date, now: Date): boolean => expiresAt <= now;

export interface InviteFacts {
  readonly token: string;
  readonly status: string;
  readonly expiresAt: Date;
}

/**
 * The token to keep when the same address is invited, or sent the invite, again: the one already
 * mailed, while it still works, so the link in the mail the person has keeps working. A revoked,
 * accepted or expired invite gets a new one, so revoking ends the old link and an expired link is
 * never revived.
 */
export const reusableInviteToken = (
  existing: InviteFacts | undefined,
  now: Date,
): string | null =>
  existing && existing.status === "pending" && !isInviteExpired(existing.expiresAt, now)
    ? existing.token
    : null;

/** What opening an invite link shows. */
export type InviteLinkState = "invalid" | "accepted" | "revoked" | "expired" | "open";

/**
 * "invalid" covers a token no row holds: never issued, or replaced when the address was invited
 * again after this link had expired or been withdrawn.
 */
export const inviteLinkState = (
  invite: Pick<InviteFacts, "status" | "expiresAt"> | undefined,
  now: Date,
): InviteLinkState => {
  if (!invite) return "invalid";
  if (invite.status === "accepted") return "accepted";
  if (invite.status === "revoked") return "revoked";
  if (invite.status !== "pending") return "invalid";
  return isInviteExpired(invite.expiresAt, now) ? "expired" : "open";
};
