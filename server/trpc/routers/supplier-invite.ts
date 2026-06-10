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
import { z } from "zod";
import { eq, and, desc, isNull, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import { insertRow } from "../typed";
import { supplierInvite, company } from "@/schema";
import { supplierInviteRequestSchema } from "@/schema/validators";
import { randomBytes } from "node:crypto";
import { sendMail, entityInvitesSupplierEmail } from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";

/** 64-char hex magic-link token. */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/** 30 days from now. */
function defaultExpiry(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export const supplierInviteRouter = router({
  /**
   * Create (or refresh) an invite to a supplier email. If the same entity
   * already has a pending invite to that email, we bump the token and expiry
   * rather than creating a duplicate row. Returns the invite token so the
   * caller could surface a copy-link UX in addition to the email.
   *
   * Idempotent on (fromCompanyId, toEmail).
   */
  create: companyProcedure
    .input(supplierInviteRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const email = input.toEmail.toLowerCase();
      const token = generateInviteToken();
      const expiresAt = defaultExpiry();

      const [row] = await ctx.db
        .insert(supplierInvite)
        .values(
          insertRow(supplierInvite, {
            fromCompanyId: ctx.companyId,
            toEmail: email,
            token,
            message: input.message ?? null,
            expiresAt,
          }),
        )
        // Bump the existing invite if there's already a pending one for the
        // same (entity, email) pair. Re-invite = new token + new expiry, but
        // we never duplicate the row.
        .onConflictDoUpdate({
          target: [supplierInvite.fromCompanyId, supplierInvite.toEmail],
          set: {
            token,
            message: input.message ?? null,
            expiresAt,
            // Reset the acceptance state so a previously-revoked invite can
            // be re-issued. Defensive — entity wants to re-invite.
            acceptedAt: null,
            acceptedByCompanyId: null,
          },
        })
        .returning();

      if (!row) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invite",
        });
      }

      // Look up the entity name for the email.
      const entity = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      });

      // Fire-and-forget — the row is the source of truth, the email is
      // best-effort. The supplier could also be given the link directly.
      const inviteUrl = `${getAppUrl()}/supplier-invite/${row.token}`;
      sendMail({
        to: email,
        ...entityInvitesSupplierEmail({
          entityName: entity?.name ?? "A NIS2 entity",
          inviteUrl,
          message: input.message ?? null,
        }),
      }).catch((err) =>
        console.error("[supplier-invite] email send failed:", err),
      );

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
