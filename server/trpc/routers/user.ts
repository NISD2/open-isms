import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import type { DbOrTx } from "@/lib/db";
import { SELF_SERVICE_ACTOR, SELF_SERVICE_CHANNEL } from "@/lib/gdpr/certificate";
import { eraseUser } from "@/lib/gdpr/erase-user";
import { selfErasureCheck } from "@/lib/gdpr/self-erasure";
import { sendErasureCertificate } from "@/lib/gdpr/send-certificate";
import { isLocaleCode } from "@/lib/locale";
import { HINT_COLUMN, HINTS } from "@/lib/onboarding/hints";
import { rateLimit } from "@/lib/rate-limit";
import { user } from "@/schema";
import { userUpdateSchema } from "@/schema/validators";
import { protectedProcedure, publicProcedure, router } from "../init";

export const userRouter = router({
  /**
   * Self-service display-name update. Signup only seeds `user.name` (email
   * local part for credentials signups, OAuth profile snapshot for Google)
   * and nothing ever syncs it afterwards, so this mutation is the one place
   * a user can correct the name that prints on their training certificate.
   */
  updateName: protectedProcedure
    .input(userUpdateSchema.pick({ name: true }).required())
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name cannot be empty",
        });
      }

      await ctx.db
        .update(user)
        .set({ name, updatedAt: new Date() })
        .where(eq(user.id, ctx.userId));

      return { name };
    }),

  /**
   * Remember which language this account reads the platform in.
   *
   * The language switcher used to be navigation and nothing else: it rewrote
   * the URL and let next-intl set its cookie, both of which live in one
   * browser. A cron has neither. So lifecycle mail read `user.locale`, a column
   * only ever written at registration, and somebody who signed up on the German
   * page and then switched to English got German mail forever with no way to
   * correct it. This is the way to correct it.
   *
   * Public rather than protected because the switcher also renders in the
   * marketing nav and the footer, and neither knows whether anyone is signed
   * in: there is no SessionProvider on the client, and PublicFooter
   * deliberately never calls auth() so its pages stay prerendered. Making this
   * protected would mean either threading a session prop through both, or
   * letting every signed-out language switch answer 401. A signed-out switch is
   * simply a no-op instead. Nothing is read, and the only row that can be
   * written is ctx.userId's own — the caller names a language, never a user.
   */
  setLocale: publicProcedure
    .input(z.object({ locale: z.string().refine(isLocaleCode) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) return { persisted: false };

      // No updatedAt bump. dismissHint, the other incidental-preference write
      // in this router, deliberately leaves it alone, and platform-admin's
      // unsubscribe view orders by desc(user.updatedAt) as a stand-in for
      // "recently unsubscribed" — a language switch is not that.
      await ctx.db
        .update(user)
        .set({ locale: input.locale })
        .where(eq(user.id, ctx.userId));

      return { persisted: true };
    }),

  /**
   * Retire a one-time onboarding surface for the calling user.
   *
   * Scoped to `ctx.userId` and nothing else: the hint name is the only input,
   * so there is no id a caller could point at somebody else's row. Idempotent
   * — a second call just restamps a column that is already gating the surface
   * off.
   */
  dismissHint: protectedProcedure
    .input(z.object({ hint: z.enum(HINTS) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await ctx.db
        .update(user)
        .set({ [HINT_COLUMN[input.hint]]: now })
        .where(eq(user.id, ctx.userId));

      return { hint: input.hint };
    }),

  /** Whether the signed-in person may delete their own account here, and what goes with it. */
  deletionCheck: protectedProcedure.query(async ({ ctx }) => {
    const email = await ownEmail(ctx.db, ctx.userId);
    return selfErasureCheck(ctx.db, { userId: ctx.userId, email });
  }),

  /**
   * Deletes the signed-in person's own account for good (Art. 17 GDPR) and emails them the
   * certificate. The typed email is the confirmation; the rules are decided again here, never taken
   * from the dialog. No audit row names them: the user is gone, and the erasure record is the trail.
   */
  deleteAccount: protectedProcedure
    .input(z.object({ confirmEmail: z.string().max(320) }))
    .mutation(async ({ ctx, input }) => {
      const email = await ownEmail(ctx.db, ctx.userId);
      if (input.confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The email does not match this account.",
        });
      }
      if (!(await rateLimit(`self-erase:${ctx.userId}`, 3, 60 * 60 * 1000))) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts." });
      }
      const check = await selfErasureCheck(ctx.db, { userId: ctx.userId, email });
      if (!check.allowed) {
        throw new TRPCError({ code: "FORBIDDEN", message: check.reason });
      }

      const result = await eraseUser({
        userId: ctx.userId,
        actor: { userId: null, email: SELF_SERVICE_ACTOR },
        request: {
          requestReceivedAt: new Date(),
          requestChannel: SELF_SERVICE_CHANNEL,
          rightsInvoked: "Right to erasure (Art. 17)",
          notes: null,
        },
      });
      await logAudit({
        companyId: null,
        userId: null,
        action: "gdpr.erase_user",
        entityType: "user",
        entityId: ctx.userId,
        description: `Account holder erased their own account (case ${result.caseRef}, method ${result.method}${result.companyTornDown ? ", company torn down" : ""})`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      const certificateSent = await sendErasureCertificate(ctx.db, {
        logId: result.logId,
        caseRef: result.caseRef,
        to: email,
      });
      return { caseRef: result.caseRef, certificateSent };
    }),
});

/** The account's own address from the database, not the session snapshot. */
const ownEmail = async (db: DbOrTx, userId: string) => {
  const [row] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
  return row.email;
};
