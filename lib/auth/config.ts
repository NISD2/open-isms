import "@/lib/server-guard";
import { cache } from "react";
import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, company } from "@/schema";
import type { Session } from "next-auth";
import type { Provider } from "next-auth/providers";

import { env } from "@/lib/env";
import {
  sendMail,
  sendWelcomeEmail,
  newUserSignupEmail,
} from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";
import { checkEmailQuality } from "@/lib/auth/email-quality";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { createDraftCompany } from "@/server/trpc/helpers/setup-helpers";
import { resolveHints } from "@/lib/onboarding/hints";

// Dummy hash for timing-safe comparison when user doesn't exist
const DUMMY_HASH = "$2a$12$000000000000000000000uGBYRMjo5lsWIKE/k.HdGZfR5YmKKKu";

/**
 * Carries a machine-readable code from `authorize()` to the sign-in client.
 *
 * NextAuth only forwards the `code` property of a thrown `CredentialsSignin`
 * to the browser. A plain `throw new Error("EMAIL_NOT_VERIFIED")` is NOT
 * forwarded: it gets swallowed into a generic `error=Configuration` with no
 * code, so the UI can't distinguish the flow state from "wrong password"
 * and shows the wrong message. The sign-in flow branches on these codes
 * (e.g. EMAIL_NOT_VERIFIED nudges the user to the verify-email step), so
 * they must reach the client intact.
 */
class CredentialsFlowError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

// In-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

function isLoginRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

const providers: Provider[] = [
  // Email/password. Email is proven-owned once at registration via the
  // verify-email OTP flow; subsequent logins are password-only.
  Credentials({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
      const password = credentials?.password as string | undefined;

      if (!email || !password) return null;
      if (password.length > 128) return null;

      if (isLoginRateLimited(email)) return null;

      const dbUser = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      // Always run bcrypt.compare to prevent timing attacks
      const hash = dbUser?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(password, hash);

      if (!dbUser || !dbUser.passwordHash || !valid) return null;

      // Block unverified email-password accounts. The signin UI handles this
      // specific error code by prompting the user to verify their email.
      // Google OAuth users don't go through this branch and are implicitly
      // trusted because Google verifies profile.email_verified upstream.
      if (!dbUser.emailVerifiedAt) {
        throw new CredentialsFlowError("EMAIL_NOT_VERIFIED");
      }

      return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
    },
  }),

  // Google OAuth
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
];

// Dev provider — accepts any registered email with no password check.
// HARD-GATED on NODE_ENV !== "production". An accidental ENABLE_DEV_AUTH=true
// in a production environment is a full auth bypass, so the env-var alone is
// not sufficient — the production check is the belt and the env-var is the
// suspenders.
if (
  process.env.NODE_ENV !== "production" &&
  process.env.ENABLE_DEV_AUTH === "true"
) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev Login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email) return null;
        const dbUser = await db.query.user.findFirst({
          where: eq(user.email, email),
        });
        if (!dbUser) return null;
        return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  // Audit EW-12 (2026-06-11): 8h dropped from 24h. Auth.js refreshes
  // the JWT silently during active use, so engaged users see no UX hit;
  // idle users sign back in once a workday instead of once every three.
  // Cuts the exposure window for a leaked JWT by 3x. M-1 already lets
  // password reset revoke immediately, so the maxAge is mostly the
  // "user wandered off, didn't reset" window.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours

  pages: {
    signIn: "/auth/signin",
  },

  callbacks: {
    async signIn({ user: authUser, profile, account }) {
      if (!authUser.email) return false;

      if (account?.provider === "google") {
        // Only allow verified Google emails
        if (!profile?.email_verified) return false;

        // Disposable-email parity with /api/auth/register: capture the user
        // record so the scope attempt shows in admin, but refuse the signin.
        // No admin alert and no welcome email — those only fire for the
        // happy path below.
        const quality = await checkEmailQuality(authUser.email);
        if (quality.block) {
          await db
            .insert(user)
            .values({
              email: authUser.email,
              name: authUser.name ?? profile?.name ?? authUser.email,
              role: "member",
              isDisposableEmail: true,
              // emailVerifiedAt stays null — disposable cannot be verified
            })
            .onConflictDoNothing({ target: user.email });
          console.log(
            `[auth] Silent block Google signin (${quality.reason}):`,
            authUser.email.split("@")[1],
          );
          return false;
        }

        const newName = authUser.name ?? profile?.name ?? authUser.email;

        // Atomic upsert — survives concurrent OAuth flows for the same new
        // email (otherwise both `findFirst` calls miss, both inserts race,
        // and the loser hits a unique-constraint 500 on /api/auth/callback).
        const now = new Date();
        const inserted = await db
          .insert(user)
          .values({
            email: authUser.email,
            name: newName,
            role: "member",
            // Google verified `profile.email_verified` upstream so we trust
            // the address — no separate OTP step for OAuth signups.
            emailVerifiedAt: now,
          })
          .onConflictDoNothing({ target: user.email })
          .returning({ id: user.id });

        let userId: string | null = inserted[0]?.id ?? null;
        // Provision a draft company for genuinely new signups, and for pending-
        // verify accounts that complete verification via Google (their first
        // proven-owned moment). Not for returning, already-provisioned logins.
        let shouldProvision = inserted.length > 0;

        if (inserted.length === 0) {
          // Email already existed → clear any password so Google takes
          // precedence, and mark verified (covers pending-verify accounts
          // who chose Google instead of completing the email OTP step).
          const existing = await db.query.user.findFirst({
            where: eq(user.email, authUser.email),
          });
          if (existing) {
            userId = existing.id;
            const patch: Partial<typeof user.$inferInsert> = { updatedAt: now };
            if (existing.passwordHash) patch.passwordHash = null;
            if (!existing.emailVerifiedAt) {
              patch.emailVerifiedAt = now;
              shouldProvision = true;
            }
            if (Object.keys(patch).length > 1) {
              await db.update(user).set(patch).where(eq(user.id, existing.id));
            }
          }
        } else {
          // Truly new user — notify admins + welcome.
          // Awaited so serverless doesn't terminate before send.
          const admins = [...getPlatformAdminEmails()];
          await Promise.all([
            admins.length > 0
              ? sendMail({
                  to: admins,
                  ...newUserSignupEmail({ userEmail: authUser.email, userName: newName, provider: account.provider }),
                }).catch((err) => console.error("[auth] Failed to send admin signup alert:", err))
              : Promise.resolve(),
            sendWelcomeEmail({ name: newName, email: authUser.email })
              .catch((err) => console.error("[auth] Failed to send welcome email:", err)),
          ]);
        }

        // Google users bypass the verify-email route, so this is their draft-
        // company provisioning boundary. Idempotent; a failure logs but never
        // blocks signin.
        if (shouldProvision && userId) {
          try {
            await createDraftCompany(db, userId);
          } catch (err) {
            console.error("[auth] Failed to provision draft company:", err);
          }
        }
      }

      return true;
    },

    /**
     * Audit M-1 (2026-06-10): stamp the user's current sessionVersion
     * into the JWT at issue time so getSession() can detect revocation.
     * `user` is only supplied on first sign-in (Credentials authorize
     * or OAuth sign-in); on subsequent token refreshes the stamped
     * version is what was canonical at issue time, which is exactly
     * what we want — a stale token whose version is below the live
     * user.sessionVersion gets rejected.
     */
    async jwt({ token, user: authUser }) {
      if (authUser?.email) {
        // Same hook also counts the login. `authUser` is supplied only when a
        // session is first established, never on the silent refreshes that
        // keep the 8h token alive, so this is one increment per sign-in and
        // not one per request. Folded into the sessionVersion read as a single
        // UPDATE ... RETURNING: same round trip as before, and the increment
        // is atomic, so two concurrent sign-ins cannot land on one number.
        const [dbUser] = await db
          .update(user)
          .set({ loginCount: sql`${user.loginCount} + 1` })
          .where(eq(user.email, authUser.email))
          .returning({ sessionVersion: user.sessionVersion });
        token.sessionVersion = dbUser?.sessionVersion ?? 1;
      }
      return token;
    },

    async session({ session, token }) {
      session.companyId = null;
      session.companyActivated = false;
      session.role = "member";
      session.jobTitle = null;
      session.sessionVersion = token.sessionVersion ?? null;
      session.hints = { journeyTour: false, requirementTour: false, helpOffer: false };
      return session;
    },
  },
});

/**
 * Get the current session with fresh id/companyId/role from DB, and
 * verify the JWT's sessionVersion against the live user row (audit
 * M-1, 2026-06-10) so revoked tokens stop working. React cache()
 * ensures a single DB query per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const session = await auth();
  if (!session?.user?.email) return null;

  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, session.user.email),
    columns: {
      id: true,
      name: true,
      companyId: true,
      role: true,
      jobTitle: true,
      sessionVersion: true,
      loginCount: true,
      journeyTourDismissedAt: true,
      requirementTourDismissedAt: true,
      helpOfferDismissedAt: true,
    },
  });
  if (!dbUser) return null;

  // Treat absent sessionVersion as stale (audit L-2, 2026-06-11). Tokens
  // issued before M-1 deployed carry no sessionVersion claim, so a
  // `!= null && <` check short-circuited and they remained valid past
  // password reset. Forcing a re-sign-in on those tokens — once per
  // mid-session user — is the cost of M-1 actually working for everyone.
  if (session.sessionVersion == null || session.sessionVersion < dbUser.sessionVersion) {
    return null;
  }

  session.user.id = dbUser.id;
  // DB name wins over the JWT snapshot so an in-app name change (e.g. fixing
  // the name printed on a training certificate) shows up without re-login.
  session.user.name = dbUser.name;
  session.companyId = dbUser.companyId;
  session.role = dbUser.role;
  session.jobTitle = dbUser.jobTitle ?? null;
  // Derived here rather than queried at the point of use: the row is already
  // loaded and cache()d for the request, so the one-time onboarding surfaces
  // cost no extra round trip on any page that renders them.
  session.hints = resolveHints(dbUser);

  // Resolve activation once, here, so every gate reads session.companyActivated
  // instead of re-deriving it (a draft shell has companyId set but activatedAt
  // null). cache() keeps this to one extra indexed lookup per request.
  session.companyActivated = false;
  if (dbUser.companyId) {
    const companyRow = await db.query.company.findFirst({
      where: eq(company.id, dbUser.companyId),
      columns: { activatedAt: true },
    });
    session.companyActivated = companyRow?.activatedAt != null;
  }

  return session;
});
