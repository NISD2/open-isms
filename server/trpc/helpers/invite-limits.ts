/**
 * Who may send which invite, and how often. Every invite mails an address someone typed in, so each
 * kind is capped per day; the hand-off to management is the account holder's alone.
 */
import { TRPCError } from "@trpc/server";
import { holderOf } from "@/lib/billing/accounts";
import type { Database } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { handoffLocaleOf } from "./invite-mail";

/** Hand-offs to management one company may send per day: a few retries above honest use. */
export const FORWARD_LIMIT = 5;
/** Team invites one company may send per day: room to onboard a whole department in one sitting. */
export const INVITE_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Every invite mails an address someone typed in, so each kind is capped per company per day. */
export async function enforceDailyInviteCap(
  kind: "invite" | "forward",
  companyId: string,
  limit: number,
): Promise<void> {
  if (!(await rateLimit(`team:${kind}:${companyId}`, limit, DAY_MS))) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Your organization has sent many of these today. Please try again tomorrow.",
    });
  }
}

/**
 * "Send again" under the rules of the invite it sends: a hand-off to management only by the
 * account holder and under the hand-off's cap (as `team.forwardToManagement`), anything else under
 * the team invite's cap.
 */
export async function authorizeResend(
  db: Database,
  sender: { readonly companyId: string; readonly userId: string },
  invite: { readonly redirectPath: string | null },
): Promise<void> {
  if (handoffLocaleOf(invite.redirectPath) === null) {
    return enforceDailyInviteCap("invite", sender.companyId, INVITE_LIMIT);
  }
  if ((await holderOf(db, sender.companyId)) !== sender.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the account holder can send the order to management again.",
    });
  }
  return enforceDailyInviteCap("forward", sender.companyId, FORWARD_LIMIT);
}

/**
 * The team named at setup is mailed under a cap per person, not per company: a new company is
 * created for each setup, so a company cap would start fresh every time. Never throws.
 */
export async function withinSetupInviteCap(userId: string): Promise<boolean> {
  try {
    return await rateLimit(`team:setup-invite:${userId}`, INVITE_LIMIT, DAY_MS);
  } catch {
    // An unreadable cap counts as reached: no mail rather than an unbounded one.
    return false;
  }
}
