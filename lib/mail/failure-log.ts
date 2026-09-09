import "@/lib/server-guard";
import { logAudit } from "@/lib/audit";

/** The audit action the platform-admin email page reads back. */
export const EMAIL_FAILURE_ACTION = "email.send_failed";

/**
 * Record an email that did not go out.
 *
 * Every fire-and-forget send site wraps itself in `catch {}` because a broken
 * notification must not fail the mutation that triggered it. That is right,
 * and it is also how a real failure stayed invisible: a review-decision email
 * stopped being sent for a whole class of user, and nothing anywhere said so.
 * A swallowed error is only acceptable if something else notices.
 *
 * Two sinks, deliberately:
 *
 *   console.error  — reaches `docker compose logs app` on a self-hosted box,
 *                    where there is no admin console to open.
 *   audit_log      — reaches the email page in /platform-admin, so an operator
 *                    sees it without shelling into anything. audit_log rather
 *                    than notification because notification.company_id is NOT
 *                    NULL and the failures worth catching include users who
 *                    have no company yet (an OAuth signup mid-onboarding).
 *
 * Never throws. A logger that can fail the caller is worse than no logger.
 */
export async function recordEmailFailure(input: {
  /** The message that failed, e.g. "work.review_decision". */
  readonly emailType: string;
  /** Who it was for. An address when known, else the user id, else null. */
  readonly recipient: string | null;
  readonly error: unknown;
  readonly companyId?: string | null;
  readonly userId?: string | null;
}): Promise<void> {
  const reason = input.error instanceof Error ? input.error.message : String(input.error);
  const recipient = input.recipient ?? "unknown recipient";

  console.error(`[mail] send failed type=${input.emailType} to=${recipient}: ${reason}`);

  try {
    await logAudit({
      companyId: input.companyId ?? null,
      userId: input.userId ?? null,
      action: EMAIL_FAILURE_ACTION,
      entityType: "email",
      entityId: null,
      // The address goes in newValue, not into the description, because GDPR
      // erasure redacts the JSONB columns and leaves free text alone
      // (lib/gdpr/erase-user.ts). An address in the description would outlive
      // the erasure request that was supposed to remove it, and this row is
      // rendered back out in /platform-admin.
      description: `${input.emailType} failed: ${reason}`,
      newValue: { recipient },
    });
  } catch (auditError) {
    // The audit insert is the backstop, not the point. If it is also broken,
    // the console line above still happened.
    console.error("[mail] could not record the send failure:", auditError);
  }
}
