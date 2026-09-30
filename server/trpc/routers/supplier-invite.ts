/**
 * Entity-side supplier invite router (Direction B).
 *
 * The NIS2 entity uses this to invite a supplier to fill out their security
 * profile. Sends a magic-link email; the supplier clicks it, signs up via
 * /supplier-invite/[token], and on signup we auto-bind a supplier_relationship
 * row connecting the new supplier company back to the inviting entity.
 *
 * The supplier-side counterpart lives in supplier-portal/onboarding.ts:
 *   - getInviteByToken — used by the landing page to display the invitation
 *   - acceptInvite — bootstraps the supplier company + binds the relationship
 *
 * Security: companyProcedure ensures the caller is an authenticated entity.
 * Auto-audit middleware logs the create call.
 */

import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { entityInvitesSupplierEmail, sendMail } from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";
import { company, supplierInvite } from "@/schema";
import { supplierInviteRequestSchema } from "@/schema/validators";
import { requireSupplierMailBudget } from "../helpers/supplier-mail-budget";
import { companyProcedure, router } from "../init";
import { insertRow } from "../typed";

/** 64-char hex magic-link token. */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/** How long an invite link stays valid after it is sent. */
export const INVITE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/** How long after an invite is sent before the same address can be sent it again. */
export const INVITE_RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Whether an existing invite may be mailed again. The row has no column for
 * when it was last sent, and needs none: every send sets expiresAt to the send
 * time plus the lifetime, and revoke sets it to the moment of revocation. So a
 * live invite was sent exactly one lifetime before it expires, and one that was
 * revoked or ran out was sent no later than when it stopped. Reading the second
 * case as "sent then" makes a revoke-and-invite-again loop wait out the
 * cooldown too; the price is that an invite that simply ran out waits up to one
 * cooldown longer than it needs to.
 */
export function canResendInvite(expiresAt: Date, now: Date): boolean {
  const lastSentAt =
    expiresAt > now ? expiresAt.getTime() - INVITE_LIFETIME_MS : expiresAt.getTime();
  return now.getTime() - lastSentAt >= INVITE_RESEND_COOLDOWN_MS;
}

const resendTooSoon = () =>
  new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message:
      "This supplier was already invited in the last 24 hours. You can send the invitation again after that.",
  });

export const supplierInviteRouter = router({
  /**
   * Create an invite to a supplier email, or send an existing one again with a
   * new token and expiry once the cooldown is over. Returns the invite token
   * so the caller could surface a copy-link UX in addition to the email.
   *
   * One row per (fromCompanyId, toEmail); never duplicated.
   */
  create: companyProcedure
    .input(supplierInviteRequestSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSupplierMailBudget("supplierInvites", ctx.companyId);
      const email = input.toEmail.toLowerCase();
      const now = new Date();
      const token = generateInviteToken();
      const expiresAt = new Date(now.getTime() + INVITE_LIFETIME_MS);
      const message = input.message ?? null;

      const existing = await ctx.db.query.supplierInvite.findFirst({
        where: and(
          eq(supplierInvite.fromCompanyId, ctx.companyId),
          eq(supplierInvite.toEmail, email),
        ),
        columns: { id: true, expiresAt: true, token: true },
      });
      if (existing && !canResendInvite(existing.expiresAt, now)) throw resendTooSoon();
      if (!existing) await requireSupplierMailBudget("newRecipients", ctx.companyId);

      const [row] = existing
        ? await ctx.db
            .update(supplierInvite)
            .set({
              token,
              message,
              expiresAt,
              // Reset the acceptance state so a previously-revoked invite can
              // be re-issued. Defensive — entity wants to re-invite.
              acceptedAt: null,
              acceptedByCompanyId: null,
            })
            // Only while it still has the token that was read (every send
            // replaces it), so two calls racing past the cooldown check send
            // one mail, not two.
            .where(
              and(
                eq(supplierInvite.id, existing.id),
                eq(supplierInvite.token, existing.token),
              ),
            )
            .returning()
        : await ctx.db
            .insert(supplierInvite)
            .values(
              insertRow(supplierInvite, {
                fromCompanyId: ctx.companyId,
                toEmail: email,
                token,
                message,
                expiresAt,
              }),
            )
            .onConflictDoNothing({
              target: [supplierInvite.fromCompanyId, supplierInvite.toEmail],
            })
            .returning();

      // No row: a concurrent call created or re-sent this invite a moment ago.
      if (!row) throw resendTooSoon();

      // Look up the entity name for the email.
      const entity = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      });

      // Fire-and-forget — the row is the source of truth, the email is
      // best-effort. The supplier could also be given the link directly.
      // The personal message stays on the row: the supplier reads it on the
      // invite page, never in the mail (lib/mail/templates.ts).
      const inviteUrl = `${getAppUrl()}/supplier-invite/${row.token}`;
      sendMail({
        emailType: "supplier.invite",
        to: email,
        ...entityInvitesSupplierEmail({
          entityName: entity?.name ?? null,
          inviteUrl,
          hasMessage: message !== null && message.trim() !== "",
        }),
      }).catch((err) => console.error("[supplier-invite] email send failed:", err));

      return {
        id: row.id,
        token: row.token,
        inviteUrl,
        expiresAt: row.expiresAt,
      };
    }),

  /**
   * List my pending invites — for the entity's "Outstanding requests" view.
   * Includes accepted invites for audit trail purposes (last 90 days).
   */
  list: companyProcedure.query(async ({ ctx }) => {
    return ctx.db.query.supplierInvite.findMany({
      where: eq(supplierInvite.fromCompanyId, ctx.companyId),
      orderBy: [desc(supplierInvite.createdAt)],
      limit: 100,
    });
  }),

  /** Revoke a pending invite (set expiresAt to now). Idempotent. */
  revoke: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(supplierInvite)
        .set({ expiresAt: new Date() })
        .where(
          and(
            eq(supplierInvite.id, input.id),
            eq(supplierInvite.fromCompanyId, ctx.companyId),
            isNull(supplierInvite.acceptedAt),
            gt(supplierInvite.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),
});
