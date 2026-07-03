/**
 * Data-request router — the public "please delete my data" intake.
 *
 * This does NOT erase anything. It records the request + optional feedback in
 * `data_erasure_request` and alerts the platform admins so a human can follow
 * up and action it with the existing admin Erase tool (platformAdmin.eraseUser).
 *
 * Identity is established server-side, never trusted from the client:
 *  - a valid signed follow-up link (token tied to a userId)  → verified, 'followup_link'
 *  - a logged-in session                                      → verified, 'self'
 *  - neither                                                  → unverified, 'public' (rate-limited)
 *
 * The response is identical whether or not the email matches an account, so the
 * endpoint never leaks account existence.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, type TRPCContext } from "../init";
import { user, dataErasureRequest } from "@/schema";
import { verifyDeletionRequestToken } from "@/lib/email/deletion-request";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { sendMail, dataDeletionRequestEmail } from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

type ResolvedSource = "followup_link" | "self" | "public";

interface Resolved {
  email: string;
  subjectUserId: string | null;
  source: ResolvedSource;
  verified: boolean;
}

export const dataRequestRouter = router({
  /**
   * Record a deletion request. Public on purpose (the follow-up link must work
   * without logging back in), but identity + verification are derived here, not
   * taken from the caller.
   */
  submit: publicProcedure
    .input(
      z.object({
        token: z.string().max(64).optional(),
        userId: z.string().uuid().optional(),
        email: z.string().trim().toLowerCase().email().max(320).optional(),
        feedback: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Cheap defence-in-depth on an unauthenticated write, applied to every path.
      if (!rateLimit(`ddr-ip:${ctx.ip}`, 10, 60 * 60 * 1000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }

      const resolved = await resolveIdentity(ctx, input);

      // A valid token for an account that no longer exists (already erased):
      // nothing to record or delete. Return the same confirmation.
      if (!resolved) {
        return { ok: true } as const;
      }

      await ctx.db.insert(dataErasureRequest).values({
        email: resolved.email,
        subjectUserId: resolved.subjectUserId,
        feedback: input.feedback && input.feedback.length > 0 ? input.feedback : null,
        source: resolved.source,
        verified: resolved.verified,
      });

      // Alert platform admins. Non-blocking: a mail failure must not fail the
      // request (the row is already persisted and shows up in the admin view).
      const admins = getPlatformAdminEmails();
      if (admins.length > 0) {
        await sendMail({
          to: [...admins],
          ...dataDeletionRequestEmail({
            requesterEmail: resolved.email,
            feedback: input.feedback && input.feedback.length > 0 ? input.feedback : null,
            source: resolved.source,
            verified: resolved.verified,
            adminUrl: `${getAppUrl()}/platform-admin`,
          }),
        }).catch((err) =>
          console.error("[data-request] Failed to send admin alert:", err),
        );
      }

      return { ok: true } as const;
    }),
});

/**
 * Establish who is asking. Returns null only when a signed link is valid but
 * the account is already gone (nothing left to do).
 */
async function resolveIdentity(
  ctx: TRPCContext,
  input: { token?: string; userId?: string; email?: string },
): Promise<Resolved | null> {
  // 1. Signed follow-up link.
  if (input.token && input.userId && verifyDeletionRequestToken(input.userId, input.token)) {
    const row = await ctx.db.query.user.findFirst({
      where: eq(user.id, input.userId),
      columns: { id: true, email: true },
    });
    if (!row) return null; // token valid, account already erased
    return {
      email: row.email.toLowerCase(),
      subjectUserId: row.id,
      source: "followup_link",
      verified: true,
    };
  }

  // 2. Logged-in session.
  if (ctx.session?.user?.email) {
    return {
      email: ctx.session.user.email.toLowerCase(),
      subjectUserId: ctx.session.user.id,
      source: "self",
      verified: true,
    };
  }

  // 3. Anonymous public path — requires an email, rate-limited by address, and
  //    is never trusted (verified stays false). Look up a matching account so
  //    the admin can act, but never reveal the result to the caller.
  const email = input.email;
  if (!email) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "An email address is required.",
    });
  }
  if (!rateLimit(`ddr-email:${email}`, 3, 24 * 60 * 60 * 1000)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "This address has already been submitted. We are on it.",
    });
  }
  const match = await ctx.db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true },
  });
  return {
    email,
    subjectUserId: match?.id ?? null,
    source: "public",
    verified: false,
  };
}
