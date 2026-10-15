import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { epochSeconds, isRecentSignIn } from "@/lib/auth/session-age";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { encloseCancelNotice, sendCancelNotice } from "@/lib/billing/cancel-notice";
import type { DbOrTx } from "@/lib/db";
import { alertGdprOperators } from "@/lib/gdpr/alert";
import { SELF_SERVICE_ACTOR, SELF_SERVICE_CHANNEL } from "@/lib/gdpr/certificate";
import { ErasureRefused, eraseUser } from "@/lib/gdpr/erase-user";
import {
  assertSelfErasureAllowed,
  cancelLicencesForErasure,
  type SelfErasure,
  SelfErasureRefused,
  selfErasureCheck,
} from "@/lib/gdpr/self-erasure";
import { sendErasureCertificate } from "@/lib/gdpr/send-certificate";
import { isLocaleCode } from "@/lib/locale";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { assistantsAllowed } from "@/lib/mcp/allowed";
import { issuer } from "@/lib/mcp/config";
import { instanceKey } from "@/lib/mcp/instance-key";
import { mintKey, PASTED_KEY_SECONDS } from "@/lib/mcp/key";
import { bumpMcpKeyVersion, mcpKeyVersionOf } from "@/lib/mcp/key-version";
import { allow, readRequest } from "@/lib/mcp/oauth";
import { HINT_COLUMN, HINTS } from "@/lib/onboarding/hints";
import { rateLimit } from "@/lib/rate-limit";
import { user } from "@/schema";
import { userUpdateSchema } from "@/schema/validators";
import {
  companyProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  selfErasureProcedure,
} from "../init";

/** The company the page showed when the person clicked, which the key or code is made for. */
const shownCompany = z.object({ companyId: z.string().uuid() });

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

  /**
   * A key for the person's AI assistants (lib/mcp): it works in the company open now, as this
   * person with their role, for 90 days. Shown once and stored nowhere. Bumping the version first
   * ends the previous key and every assistant signed in before, so a person holds one key at a
   * time. An assistant cannot make itself a key.
   */
  createMcpKey: companyProcedure.input(shownCompany).mutation(async ({ ctx, input }) => {
    mayConnectAssistant(ctx);
    sameCompany(ctx, input.companyId);
    await companyAllowsAssistants(ctx);
    const version = await bumpMcpKeyVersion(ctx.db, ctx.userId);
    if (version === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    }
    const key = mintKey(
      instanceKey(),
      { sub: ctx.userId, cid: ctx.companyId, ver: version },
      "mcp",
      epochSeconds(new Date()),
      PASTED_KEY_SECONDS,
    );
    return { key };
  }),

  /**
   * The person allowed an assistant on the consent page (lib/mcp/oauth.ts): the address it goes
   * back to, with a code for this person in the company open now. The audit row of this call is
   * the record of who connected which assistant.
   */
  allowMcpClient: companyProcedure
    .input(shownCompany.extend({ request: z.string().max(8192) }))
    .mutation(async ({ ctx, input }) => {
      mayConnectAssistant(ctx);
      sameCompany(ctx, input.companyId);
      await companyAllowsAssistants(ctx);
      const now = epochSeconds(new Date());
      const request = readRequest(instanceKey(), input.request, now);
      if (!request) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This request has expired. Connect again from the assistant.",
        });
      }
      const version = await mcpKeyVersionOf(ctx.db, ctx.userId);
      if (version === null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
      }
      const holder = { sub: ctx.userId, cid: ctx.companyId, ver: version };
      return { url: allow(instanceKey(), request, holder, issuer(), now) };
    }),

  /** Ends the person's key and every assistant they connected, at once. */
  disconnectMcp: protectedProcedure.mutation(async ({ ctx }) => {
    await bumpMcpKeyVersion(ctx.db, ctx.userId);
    return { disconnected: true };
  }),

  /** Whether the signed-in person may delete their own account here, and what goes with it. */
  deletionCheck: protectedProcedure.query(async ({ ctx }): Promise<SelfErasure> => {
    if (!signedInJustNow(ctx.session.authTime)) {
      return { allowed: false, reason: "reauth" };
    }
    const { email } = await ownAccount(ctx.db, ctx.userId);
    return selfErasureCheck(ctx.db, { userId: ctx.userId, email });
  }),

  /**
   * Deletes the signed-in person's own account for good (Art. 17 GDPR) and emails them the
   * certificate. The typed email is the confirmation; the rules are decided again here, never taken
   * from the dialog. A paid licence still open is cancelled first, and a cancel that fails stops
   * the deletion (lib/gdpr/self-erasure.ts). The erasure's audit row carries the case reference
   * and nothing that identifies the person (no user id, address, IP or browser): it is written
   * after the erasure has scrubbed the trail, and the erasure record is where they are named, for
   * as long as that is kept.
   *
   * The cancel's confirmation travels in the erasure confirmation, so the person gets one letter.
   * With a credit note it waits for the PDF, which Qonto is polled for, so it is sent after the
   * answer; a process stopped in that wait (a deploy) sends nothing, and the Erasures tab still
   * holds the certificate. If the erasure fails after the cancel, the cancel stands and its
   * confirmation goes out on its own.
   */
  deleteAccount: selfErasureProcedure
    .input(z.object({ confirmEmail: z.string().max(320) }))
    .mutation(async ({ ctx, input }) => {
      const account = await ownAccount(ctx.db, ctx.userId);
      const email = account.email;
      if (input.confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The email does not match this account.",
        });
      }
      if (!signedInJustNow(ctx.session.authTime)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "reauth" });
      }
      if (!(await rateLimit(`self-erase:${ctx.userId}`, 3, 60 * 60 * 1000))) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts." });
      }
      const person = { userId: ctx.userId, email };
      const result = await cancelLicencesForErasure(ctx.db, person)
        .then((notices) =>
          eraseUser({
            userId: ctx.userId,
            actor: { userId: null, email: SELF_SERVICE_ACTOR },
            request: {
              requestReceivedAt: new Date(),
              requestChannel: SELF_SERVICE_CHANNEL,
              rightsInvoked: "Right to erasure (Art. 17)",
              notes: null,
            },
            guard: assertSelfErasureAllowed(person),
          }).then(
            (erased) => ({ ...erased, notices }),
            (err: unknown) =>
              Promise.all(notices.map(sendCancelNotice)).then(() => {
                throw err;
              }),
          ),
        )
        .catch((err: unknown) => {
          // The reason is the dialog's message key (portal.deleteAccount.refused).
          if (err instanceof SelfErasureRefused) {
            throw new TRPCError({ code: "FORBIDDEN", message: err.reason });
          }
          if (err instanceof ErasureRefused) {
            throw new TRPCError({ code: "FORBIDDEN", message: "several_organizations" });
          }
          throw err;
        });
      await logAudit({
        companyId: null,
        userId: null,
        action: "gdpr.erase_user",
        entityType: "user",
        entityId: null,
        description: `Account holder erased their own account (case ${result.caseRef}, method ${result.method}${result.companyTornDown ? ", company torn down" : ""})`,
        ipAddress: null,
        userAgent: null,
      });
      const letter = Promise.all(
        result.notices.map((notice) => encloseCancelNotice(notice)),
      )
        .then((enclosures) =>
          sendErasureCertificate(ctx.db, {
            logId: result.logId,
            caseRef: result.caseRef,
            to: email,
            locale: resolveEmailLocale(account.locale, null),
            enclosures,
          }),
        )
        .catch((err: unknown) =>
          alertGdprOperators(`${result.caseRef}: Bestätigung von Hand senden`, [
            `Die Löschbestätigung zum Vorgang ${result.caseRef} wurde nicht erstellt: ${err instanceof Error ? err.message : String(err)}.`,
            "Bitte das Zertifikat im Tab Erasures herunterladen und von Hand senden, mit der Gutschrift aus Qonto, falls die Löschung eine Lizenz gekündigt hat.",
          ]),
        );
      // Without a cancelled licence nothing is waited for, so the letter goes before the answer.
      if (result.notices.length === 0) await letter;
      return { caseRef: result.caseRef };
    }),
});

/** Deleting the account cannot be undone, so it asks for a sign-in from the last few minutes. */
const signedInJustNow = (authTime: number | null | undefined) =>
  isRecentSignIn(authTime ?? null, epochSeconds(new Date()));

/**
 * Throws unless the person may connect an AI assistant now: from the browser, never with a key;
 * with the walkthrough the assistant works in (the gate the durchgang procedures apply); and
 * signed in within the last few minutes, because a key or an assistant's sign-in outlives the
 * browser session it was made in, sign-out included. "reauth" sends the page to sign in again.
 */
function mayConnectAssistant(ctx: {
  readonly viaKey: boolean;
  readonly session: {
    readonly accessLevel: Parameters<typeof mayWalkDurchgang>[0];
    readonly authTime?: number | null;
    readonly user: { readonly email?: string | null };
  };
}): void {
  if (ctx.viaKey) throw new TRPCError({ code: "FORBIDDEN" });
  if (
    !mayWalkDurchgang(ctx.session.accessLevel, isPlatformAdmin(ctx.session.user.email))
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "The Durchgang is not part of this plan.",
    });
  }
  if (!signedInJustNow(ctx.session.authTime)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "reauth" });
  }
}

/**
 * Throws when the person switched company in another tab after the page loaded: the key or code
 * would work in a company the page did not name.
 */
function sameCompany(ctx: { readonly companyId: string }, shown: string): void {
  if (shown !== ctx.companyId) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The company changed in another tab. Reload the page.",
    });
  }
}

/**
 * Throws unless the company's admin has let its people connect assistants
 * (`company.assistants_allowed`); "assistants_off" tells the page to say so.
 */
async function companyAllowsAssistants(ctx: {
  readonly db: DbOrTx;
  readonly companyId: string;
}): Promise<void> {
  if (!(await assistantsAllowed(ctx.db, ctx.companyId))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "assistants_off" });
  }
}

/** The account's own address and language from the database, not the session snapshot. */
const ownAccount = async (db: DbOrTx, userId: string) => {
  const [row] = await db
    .select({ email: user.email, locale: user.locale })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
  return row;
};
