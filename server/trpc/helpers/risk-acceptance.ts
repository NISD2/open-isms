import type { risk } from "@/schema";

type AcceptanceColumns = Pick<typeof risk.$inferInsert, "acceptedBy" | "acceptedAt">;

/**
 * The acceptance columns a risk write sets. Accepting a residual risk is the sign-off the risk
 * register records (lib/nis2-documents.ts), so who accepted and when are the server's facts: the
 * caller and the time of the request. The client only says whether the risk is accepted, which is
 * why the input is a flag and never a user id or a date.
 *
 * `undefined` leaves both columns alone. `false` clears both, so a row never names someone who
 * accepted without a time, or the reverse.
 */
export function riskAcceptanceValues(
  accepted: boolean | undefined,
  userId: string,
  now: Date,
): AcceptanceColumns {
  if (accepted === undefined) return {};
  return accepted
    ? { acceptedBy: userId, acceptedAt: now }
    : { acceptedBy: null, acceptedAt: null };
}
