import "@/lib/server-guard";
import { cache } from "react";
import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
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

  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 24 hours

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

        if (inserted.length === 0) {
          // Email already existed → clear any password so Google takes
          // precedence, and mark verified (covers pending-verify accounts
          // who chose Google instead of completing the email OTP step).
          const existing = await db.query.user.findFirst({
            where: eq(user.email, authUser.email),
          });
          if (existing) {
            const patch: Partial<typeof user.$inferInsert> = { updatedAt: now };
            if (existing.passwordHash) patch.passwordHash = null;
            if (!existing.emailVerifiedAt) patch.emailVerifiedAt = now;
            if (Object.keys(patch).length > 1) {
              await db.update(user).set(patch).where(eq(user.id, existing.id));
            }
          }
        } else {
          // Truly new user — notify admins + welcome.
          // Awaited so serverless doesn't terminate before send.
          await Promise.all([
            sendMail({
              to: [...getPlatformAdminEmails()],
              ...newUserSignupEmail({ userEmail: authUser.email, userName: newName, provider: account.provider }),
            }).catch((err) => console.error("[auth] Failed to send admin signup alert:", err)),
            sendWelcomeEmail({ name: newName, email: authUser.email })
              .catch((err) => console.error("[auth] Failed to send welcome email:", err)),
          ]);
        }
      }

      return true;
    },

    async session({ session }) {
      session.companyId = null;
      session.role = "member";
      session.jobTitle = null;
      return session;
    },
  },
});

/**
 * Get the current session with fresh id/companyId/role from DB.
 * React cache() ensures a single DB query per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const session = await auth();
  if (!session?.user?.email) return null;

  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, session.user.email),
    columns: { id: true, companyId: true, role: true, jobTitle: true },
  });
  if (!dbUser) return null;

  session.user.id = dbUser.id;
  session.companyId = dbUser.companyId;
  session.role = dbUser.role;
  session.jobTitle = dbUser.jobTitle ?? null;

  return session;
});
