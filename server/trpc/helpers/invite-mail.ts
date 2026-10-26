/**
 * Mailing a team invite, for every way one is sent: the team page, the inline invite, the
 * hand-off to management, "send again" and the team named at setup.
 */
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/db";
import { accountEmailLocale, inviteEmail, sendMail } from "@/lib/mail";
import { type SendOutcome, wasDelivered } from "@/lib/mail/delivery";
import type { EmailContent } from "@/lib/mail/layout";
import { company } from "@/schema";

type Send = (opts: {
  readonly emailType: "account.invite";
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly replyTo?: string;
}) => Promise<SendOutcome>;

/**
 * Mail the invite and say whether it left. Awaited, so the person who sent it learns the answer:
 * true only when the transport took the mail, never because a transport exists. Never throws. A
 * send that did not leave writes no "sent" row; a failed one is recorded by `sendMail` itself.
 */
export async function mailInvite(input: {
  readonly companyId: string;
  readonly actorId: string;
  readonly to: string;
  readonly content: () => Promise<EmailContent & { readonly replyTo?: string }>;
  /** The audit row's words once it left, e.g. "Invite email sent to anna@example.com". */
  readonly sentDescription: string;
  /** Injected by tests; mocking the modules would leak into every other test file. */
  readonly send?: Send;
  readonly record?: typeof logAudit;
}): Promise<boolean> {
  const send: Send = input.send ?? sendMail;
  const record = input.record ?? logAudit;
  const outcome = await input
    .content()
    .then((content) => send({ emailType: "account.invite", to: input.to, ...content }))
    .catch((err: unknown): SendOutcome => {
      console.error("[team] invite email not sent", err);
      return { success: false };
    });

  const delivered = wasDelivered(outcome);
  if (delivered) {
    record({
      companyId: input.companyId,
      userId: input.actorId,
      action: "email.invite_sent",
      entityType: "email",
      entityId: outcome.id ?? null,
      description: input.sentDescription,
    });
  }
  return delivered;
}

/** The team invite mail, from the person sending it and in their account's language. */
export async function mailTeamInvite(
  sender: {
    readonly db: Database;
    readonly companyId: string;
    readonly userId: string;
    readonly session: {
      readonly user: { readonly name?: string | null; readonly email?: string | null };
    };
  },
  invite: { readonly email: string; readonly inviteUrl: string; readonly role: string },
): Promise<boolean> {
  const companyRow = await sender.db.query.company.findFirst({
    where: eq(company.id, sender.companyId),
    columns: { name: true },
  });
  // The mail's language must never cost the invite: an unreadable account sends the default.
  const inviterEmail = sender.session.user.email;
  const locale = inviterEmail
    ? await accountEmailLocale(inviterEmail).catch(() => undefined)
    : undefined;

  return mailInvite({
    companyId: sender.companyId,
    actorId: sender.userId,
    to: invite.email,
    content: () =>
      inviteEmail({
        companyName: companyRow?.name ?? "your company",
        inviterName: sender.session.user.name ?? "Your team admin",
        inviteUrl: invite.inviteUrl,
        role: invite.role,
        locale,
      }),
    sentDescription: `Invite email sent to ${invite.email}`,
  });
}
