/**
 * Roster or receipt — the one rule that decides whether a requirement is
 * waiting on named signers.
 *
 * `requirement_assignment` carries two kinds of row under one shape:
 *
 *   signedOffAt NULL → a roster entry. Someone was deliberately assigned
 *     (assignment.assignRequirement) and is expected to sign.
 *   signedOffAt set  → a receipt. assessment.signOff writes one for the signer
 *     on every single-requirement sign-off, as the record of who signed.
 *
 * Only a roster with someone still to sign makes a requirement an N-of-M that
 * belongs to the assignment flow. Treating any row as a roster made the first
 * person to sign the requirement's only permitted signer, for good.
 *
 * Kept in lib/compliance, next to role-keys.ts and for the same reason: the
 * sign-off button has to reach this without pulling drizzle-orm in behind it.
 * The server enforces the rule and the client only mirrors it to decide
 * whether to offer the button, so both reading the same function is what keeps
 * the affordance honest about what the server will actually do.
 */

/**
 * The shape both sides share. The timestamp is `Date` off a drizzle row and a
 * string once it has been through the server-component boundary; neither side
 * cares about the value, only whether it exists.
 */
export type SignerRow = {
  userId: string;
  signedOffAt: Date | string | null;
};

/** The assignees who have not signed yet. Empty means no roster is pending. */
export function pendingSignersOf<T extends SignerRow>(rows: readonly T[]): T[] {
  return rows.filter((row) => row.signedOffAt === null);
}
