/**
 * Mailing a team invite, for every way one is sent: the team page, the inline invite, the
 * hand-off to management, "send again" and the team named at setup.
 */
import { eq } from "drizzle-orm";
import { getPathname } from "@/i18n/navigation";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/db";
import { walkLocaleOf } from "@/lib/durchgang/types";
import { LOCALE_CODES, type LocaleCode } from "@/lib/locale";
import {
  accountEmailLocale,
  inviteEmail,
  managementHandoffEmail,
  sendMail,
} from "@/lib/mail";
import { type SendOutcome, wasDelivered } from "@/lib/mail/delivery";
import type { EmailContent } from "@/lib/mail/layout";
import { inviteRedirectPath } from "@/lib/organization/invite-redirect";
import { INVITE_EXPIRY_DAYS } from "@/lib/organization/invite-state";
import { company } from "@/schema";
import type { RenewedInvite } from "./company-invite";

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

/** Who an invite mail comes from: the company and the person sending it. */
export interface InviteSender {
  readonly companyId: string;
  readonly companyName: string | null;
  readonly actorId: string;
  readonly name: string | null | undefined;
  readonly email: string | null | undefined;
}

/** The sender as a procedure knows it: the company's name is read once here. */
export async function inviteSenderOf(ctx: {
  readonly db: Database;
  readonly companyId: string;
  readonly userId: string;
  readonly session: {
    readonly user: { readonly name?: string | null; readonly email?: string | null };
  };
}): Promise<InviteSender> {
  const row = await ctx.db.query.company.findFirst({
    where: eq(company.id, ctx.companyId),
    columns: { name: true },
  });
  return {
    companyId: ctx.companyId,
    companyName: row?.name ?? null,
    actorId: ctx.userId,
    name: ctx.session.user.name,
    email: ctx.session.user.email,
  };
}

/** The team invite mail, in the language of the sender's account. */
export async function mailTeamInvite(
  sender: InviteSender,
  invite: {
    readonly to: string;
    readonly inviteUrl: string;
    readonly role: string;
    readonly sentDescription?: string;
  },
): Promise<boolean> {
  // The mail's language must never cost the invite: an unreadable account sends the default.
  const locale = sender.email
    ? await accountEmailLocale(sender.email).catch(() => undefined)
    : undefined;

  return mailInvite({
    companyId: sender.companyId,
    actorId: sender.actorId,
    to: invite.to,
    content: () =>
      inviteEmail({
        companyName: sender.companyName ?? "your company",
        inviterName: sender.name ?? "Your team admin",
        inviteUrl: invite.inviteUrl,
        role: invite.role,
        locale,
      }),
    sentDescription: invite.sentDescription ?? `Invite email sent to ${invite.to}`,
  });
}

/** Where accepting a hand-off to management lands: the approval page, in the page's language. */
export const managementHandoffPath = (locale: LocaleCode): string =>
  inviteRedirectPath(getPathname({ href: "/pricing/approval", locale }));

/** The language a hand-off was sent in, read back from where it lands; null for a team invite. */
export const handoffLocaleOf = (redirectPath: string | null): LocaleCode | null =>
  LOCALE_CODES.find((locale) => managementHandoffPath(locale) === redirectPath) ?? null;

/** The hand-off to management: the person is asked to decide on the order, not only to join. */
export function mailManagementHandoff(
  sender: InviteSender,
  handoff: {
    readonly to: string;
    readonly inviteUrl: string;
    /** The person's name as the sender typed it; a mail sent again has none and greets plainly. */
    readonly name: string;
    readonly locale: LocaleCode;
  },
): Promise<boolean> {
  return mailInvite({
    companyId: sender.companyId,
    actorId: sender.actorId,
    to: handoff.to,
    content: () =>
      managementHandoffEmail({
        locale: walkLocaleOf(handoff.locale),
        name: handoff.name,
        inviterName: sender.name ?? null,
        companyName: sender.companyName,
        inviteUrl: handoff.inviteUrl,
        days: INVITE_EXPIRY_DAYS,
      }),
    sentDescription: `Management invite email sent to ${handoff.to}`,
  });
}

/** An invite sent again goes out as the mail it first was: a hand-off stays a hand-off. */
export function mailRenewedInvite(
  sender: InviteSender,
  renewed: RenewedInvite,
): Promise<boolean> {
  const handoffLocale = handoffLocaleOf(renewed.redirectPath);
  return handoffLocale
    ? mailManagementHandoff(sender, {
        to: renewed.email,
        inviteUrl: renewed.inviteUrl,
        name: "",
        locale: handoffLocale,
      })
    : mailTeamInvite(sender, {
        to: renewed.email,
        inviteUrl: renewed.inviteUrl,
        role: renewed.role ?? "member",
      });
}
