/**
 * Whether a send actually left, and mailing the operators with that answer.
 *
 * Free of imports, so code that must know whether mail went out can be tested
 * without the transport, the environment or the database behind send.ts.
 */

/**
 * The sentinel ids sendMail (and the dev-stub Resend client) return instead
 * of a Resend message id when a send was suppressed. `success: true` with one
 * of these ids means "not an error" — it never means "delivered".
 */
const SUPPRESSED_SEND_IDS: ReadonlySet<string> = new Set([
  "dev-blocked",
  "disabled",
  "no-transport",
  "dev-stub",
]);

export function isSuppressedSendId(id: string | undefined): boolean {
  return id !== undefined && SUPPRESSED_SEND_IDS.has(id);
}

/** Every shape sendMail resolves to. */
export type SendOutcome = {
  readonly success: boolean;
  readonly id?: string;
  readonly skipped?: string;
};

/**
 * A suppressed send (dev block, mail disabled, no transport) and an
 * opted-out skip both report success without sending anything.
 */
export function wasDelivered(outcome: SendOutcome): boolean {
  return (
    outcome.success && outcome.skipped === undefined && !isSuppressedSendId(outcome.id)
  );
}

/**
 * Mail the operators and say whether it went out. Never throws. The log says
 * why not without naming anyone: callers act on the answer (an erasure's
 * certificate may only say its files were handed to an operator once they
 * were), so a silent false would be as bad as a false true.
 */
export async function deliverToOperators(
  admins: readonly string[],
  send: (to: string[]) => Promise<SendOutcome>,
  label: string,
): Promise<boolean> {
  if (admins.length === 0) {
    console.error(`[mail] ${label} not sent: PLATFORM_ADMIN_EMAILS is empty`);
    return false;
  }
  const outcome = await send([...admins]).catch((): SendOutcome => ({ success: false }));
  const delivered = wasDelivered(outcome);
  if (!delivered) {
    console.error(
      `[mail] ${label} not sent: ${outcome.success ? "mail is disabled or has no transport" : "the send failed"}`,
    );
  }
  return delivered;
}
