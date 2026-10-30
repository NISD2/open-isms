import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { checkPassword } from "@/lib/auth/password-check";
import { epochSeconds, isRecentSignIn } from "@/lib/auth/session-age";
import { auditTwoFactor } from "@/lib/auth/two-factor/audit";
import { readTypedCode } from "@/lib/auth/two-factor/codes";
import { twoFactorKey } from "@/lib/auth/two-factor/crypto";
import { failureNotice, noticeTwoFactor } from "@/lib/auth/two-factor/notice";
import {
  companyRequiresTwoFactor,
  twoFactorRequirement,
} from "@/lib/auth/two-factor/policy";
import { allowCodeAttempt } from "@/lib/auth/two-factor/sign-in";
import {
  checkSecondFactor,
  confirmSetup,
  endSessionsWithoutSecondFactor,
  type FactorCheck,
  readTwoFactor,
  removeSecondFactor,
  replaceRecoveryCodes,
  startSetup,
} from "@/lib/auth/two-factor/store";
import type { DbOrTx } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { twoFactorResetEmail } from "@/lib/mail/two-factor-templates";
import { getAppUrl } from "@/lib/utils";
import { companyTwoFactor, user } from "@/schema";
import {
  accountAdminProcedure,
  platformAdminProcedure,
  protectedProcedure,
  router,
} from "../init";

/** A code from the app or a recovery code, as typed; the server reads which it is. */
const CodeInput = z.object({ totpCode: z.string().max(32) });

const key = twoFactorKey;

const tooManyCodes = () =>
  new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: "Too many codes. Wait a few minutes.",
  });
const wrongCode = () =>
  new TRPCError({ code: "BAD_REQUEST", message: "That code did not match." });

/**
 * A refused code against an active second factor: a wrong one may earn a notice; paused codes
 * and an unreadable secret both leave the recovery code as the way, and say so.
 */
const refused = (
  ctx: { readonly db: DbOrTx; readonly userId: string },
  check: Extract<FactorCheck, { ok: false }>,
) => {
  const notice =
    check.reason === "unreadable" ? null : failureNotice(check.failedAttempts);
  if (notice) noticeTwoFactor(ctx.db, ctx.userId, notice);
  if (check.reason === "wrong") return wrongCode();
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      check.reason === "locked"
        ? "Codes from the app are paused. Use a recovery code."
        : "Codes from the app can no longer be checked here. Use a recovery code.",
  });
};

/** Recovery codes still usable: none while the app is not on, whatever a pending setup holds. */
const recoveryCodesLeft = (row: Awaited<ReturnType<typeof readTwoFactor>>): number =>
  row?.enabledAt ? row.recoveryCodeHashes.length : 0;

type Ctx = {
  readonly userId: string;
  readonly companyId: string | null;
  readonly ip: string;
  readonly userAgent: string | null;
};
const self = (ctx: Ctx) => ({
  subjectId: ctx.userId,
  actorId: ctx.userId,
  companyId: ctx.companyId,
  ip: ctx.ip,
  userAgent: ctx.userAgent,
});

/** The person's address and language from the database, not the session snapshot. */
const accountOf = async (ctx: { readonly db: DbOrTx }, id: string) => {
  const [row] = await ctx.db
    .select({
      email: user.email,
      locale: user.locale,
      hasPassword: sql<boolean>`${user.passwordHash} is not null`,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No such person." });
  return row;
};
const emailOf = async (ctx: { readonly db: DbOrTx }, id: string) =>
  (await accountOf(ctx, id)).email;

/** The current password, for an account that has one; Google-only accounts send none. */
const PasswordInput = z.object({ password: z.string().max(128).optional() });

/**
 * Setting the app up takes the person, not only their session: a copied session could otherwise
 * enrol an app of its own and keep the account after the password changes. An account with a
 * password gives it, checked as the sign-in checks it and against the same per-address and per-IP
 * budget (lib/auth/password-check.ts). An account without one signs in with Google only and has no
 * password to give, so it needs a sign-in from the last few minutes instead, the rule deleting the
 * account and connecting an assistant use (lib/auth/session-age.ts). Returns the account's address.
 */
async function provePresence(
  ctx: {
    readonly db: DbOrTx;
    readonly userId: string;
    readonly ip: string;
    readonly session: { readonly authTime?: number | null } | null;
  },
  password: string | undefined,
): Promise<string> {
  const account = await accountOf(ctx, ctx.userId);
  if (!account.hasPassword) {
    if (isRecentSignIn(ctx.session?.authTime ?? null, epochSeconds(new Date()))) {
      return account.email;
    }
    throw new TRPCError({ code: "FORBIDDEN", message: "reauth" });
  }
  const checked = await checkPassword(ctx.db, account.email, password, ctx.ip);
  if (checked.ok && checked.user.id === ctx.userId) return account.email;
  if (!checked.ok && checked.reason === "rate_limited") {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many sign-in attempts. Wait a few minutes.",
    });
  }
  throw new TRPCError({ code: "UNAUTHORIZED", message: "That password did not match." });
}

/**
 * Two-factor sign-in with an authenticator app (lib/auth/two-factor): a person sets it up, checks
 * it and turns it off in Settings; a company admin can require it of everyone in the company; a
 * platform admin can remove it from someone who lost their phone and their recovery codes. None of
 * these is on an assistant key's list (lib/mcp/procedures.ts).
 */
export const twoFactorRouter = router({
  /** Where the person stands, for Settings. Nothing secret. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const { email, hasPassword } = await accountOf(ctx, ctx.userId);
    const [row, requiredBy, companyRequired] = await Promise.all([
      readTwoFactor(ctx.db, ctx.userId),
      twoFactorRequirement(ctx.db, { userId: ctx.userId, email }),
      ctx.companyId ? companyRequiresTwoFactor(ctx.db, ctx.companyId) : false,
    ]);
    return {
      enabledAt: row?.enabledAt ?? null,
      recoveryCodesLeft: recoveryCodesLeft(row),
      requiredBy,
      /** Whether the open company requires it, for the admin's switch. */
      companyRequired,
      /** Whether setting it up asks for the password, or for a recent sign-in (Google only). */
      hasPassword,
    };
  }),

  /** A new secret and recovery codes, pending until confirmSetup; shown once. Takes the password. */
  startSetup: protectedProcedure.input(PasswordInput).mutation(async ({ ctx, input }) => {
    const k = key();
    const row = await readTwoFactor(ctx.db, ctx.userId);
    if (row?.enabledAt) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Two-factor sign-in is already on.",
      });
    }
    const email = await provePresence(ctx, input.password);
    return startSetup(ctx.db, k, { userId: ctx.userId, email }, new Date());
  }),

  /** The first code from the app, which turns the pending setup on. Takes the password again. */
  confirmSetup: protectedProcedure
    .input(CodeInput.extend(PasswordInput.shape))
    .mutation(async ({ ctx, input }) => {
      const k = key();
      const typed = readTypedCode(input.totpCode);
      if (typed.kind !== "app") throw wrongCode();
      const email = await provePresence(ctx, input.password);
      if (!(await allowCodeAttempt(ctx.userId))) throw tooManyCodes();
      if (!(await confirmSetup(ctx.db, k, ctx.userId, typed.code, new Date())))
        throw wrongCode();
      const requiredBy = await twoFactorRequirement(ctx.db, {
        userId: ctx.userId,
        email,
      });
      auditTwoFactor({ kind: "enabled", how: "settings", requiredBy }, self(ctx));
      noticeTwoFactor(ctx.db, ctx.userId, "enabled");
      // Every session ended with the change (confirmSetup), this one too: the card signs out.
      return { enabled: true };
    }),

  /**
   * Turns it off, with a current code or a recovery code. Refused while the person's company or
   * the platform requires it: they would only be asked to set it up again at the next sign-in.
   */
  disable: protectedProcedure.input(CodeInput).mutation(async ({ ctx, input }) => {
    const k = key();
    const email = await emailOf(ctx, ctx.userId);
    if ((await twoFactorRequirement(ctx.db, { userId: ctx.userId, email })) !== null) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Your company requires two-factor sign-in.",
      });
    }
    if (!(await allowCodeAttempt(ctx.userId))) throw tooManyCodes();
    const check = await checkSecondFactor(
      ctx.db,
      k,
      ctx.userId,
      readTypedCode(input.totpCode),
      new Date(),
    );
    if (!check.ok) throw refused(ctx, check);
    await removeSecondFactor(ctx.db, ctx.userId);
    auditTwoFactor({ kind: "disabled", confirmedWith: check.method }, self(ctx));
    noticeTwoFactor(ctx.db, ctx.userId, "disabled");
    return { enabled: false };
  }),

  /** Ten new recovery codes, with a current code or a recovery code; the old ones stop working. */
  replaceRecoveryCodes: protectedProcedure
    .input(CodeInput)
    .mutation(async ({ ctx, input }) => {
      const k = key();
      if (!(await allowCodeAttempt(ctx.userId))) throw tooManyCodes();
      const now = new Date();
      const check = await checkSecondFactor(
        ctx.db,
        k,
        ctx.userId,
        readTypedCode(input.totpCode),
        now,
      );
      if (!check.ok) throw refused(ctx, check);
      const codes = await replaceRecoveryCodes(ctx.db, ctx.userId, now);
      if (!codes) throw wrongCode();
      auditTwoFactor({ kind: "recovery_codes_replaced" }, self(ctx));
      return { recoveryCodes: codes };
    }),

  /**
   * The company admin's switch: everyone in the company signs in with the app. Turning it on ends
   * the sessions and assistant keys of the members who sign in with a password and have no app yet
   * (endSessionsWithoutSecondFactor), in the same transaction as the rule; they set the app up at
   * their next password sign-in. Only for the admin's own open company, and only its members.
   */
  setCompanyRequired: accountAdminProcedure
    .input(z.object({ required: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const rule = {
        required: input.required,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      };
      const sessionsEndedFor = await ctx.db.transaction(
        async (tx): Promise<readonly string[]> => {
          await tx
            .insert(companyTwoFactor)
            .values({ companyId, ...rule })
            .onConflictDoUpdate({ target: companyTwoFactor.companyId, set: rule });
          return input.required ? endSessionsWithoutSecondFactor(tx, companyId) : [];
        },
      );
      logAudit({
        companyId,
        userId: ctx.userId,
        action: "company.updated",
        entityType: "company",
        entityId: companyId,
        description: input.required
          ? `Two-factor sign-in required for everyone in the company; sessions and assistant keys ended for ${sessionsEndedFor.length} member(s) without it`
          : "Two-factor sign-in no longer required",
        newValue: { twoFactorRequired: input.required, sessionsEndedFor },
        ipAddress: ctx.ip === "unknown" ? null : ctx.ip,
        userAgent: ctx.userAgent,
      });
      return {
        required: input.required,
        sessionsEnded: sessionsEndedFor.length,
        /** The admin had no app either: this session ended too, so the page signs out. */
        ownSessionEnded: sessionsEndedFor.includes(ctx.userId),
      };
    }),

  /** For the platform admin's user dialog: whether the person has it on, nothing else. */
  adminStatus: platformAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await readTwoFactor(ctx.db, input.userId);
      return {
        enabledAt: row?.enabledAt ?? null,
        recoveryCodesLeft: recoveryCodesLeft(row),
      };
    }),

  /**
   * Removes someone's authenticator app when they lost it and their recovery codes, after the
   * operator checked who is asking outside the app. Never one's own: that would let a signed-in
   * session strip its own second factor. The person is told by email, at their own address.
   */
  adminReset: platformAdminProcedure
    .input(
      z.object({ userId: z.string().uuid(), reason: z.string().trim().min(10).max(500) }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Another platform admin resets your own two-factor sign-in.",
        });
      }
      const account = await accountOf(ctx, input.userId);
      const wasEnabled = await removeSecondFactor(ctx.db, input.userId);
      auditTwoFactor(
        { kind: "reset", reason: input.reason, wasEnabled },
        {
          subjectId: input.userId,
          actorId: ctx.userId,
          companyId: null,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
      );
      const send = async () => {
        const content = await twoFactorResetEmail({
          host: new URL(getAppUrl()).host,
          locale: resolveEmailLocale(account.locale, null),
        });
        await sendMail({
          emailType: "account.two_factor_reset",
          to: account.email,
          ...content,
        });
      };
      send().catch((err) => console.error("[two-factor] reset notice not sent", err));
      return { wasEnabled };
    }),
});
