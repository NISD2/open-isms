import "@/lib/server-guard";
import bcrypt from "bcryptjs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import type { Session } from "next-auth";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { cache } from "react";
import { checkEmailQuality } from "@/lib/auth/email-quality";
import {
  decideGoogleLink,
  GOOGLE_SIGNIN_ERRORS,
  type GoogleSignInError,
  googleSignInErrorPath,
} from "@/lib/auth/google-link";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import {
  epochSeconds,
  isSessionVersionCurrent,
  isWithinAbsoluteSessionAge,
} from "@/lib/auth/session-age";
import { effectiveAccessLevel } from "@/lib/billing/access";
import { isActivePromo, PROMO_COOKIE } from "@/lib/billing/promo";
import { grandfatherByPromo } from "@/lib/billing/promo-grant";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isFeatureOn } from "@/lib/feature-flags";
import { isLocaleCode, LOCALE_COOKIE, type LocaleCode } from "@/lib/locale";
import { newUserSignupEmail, sendMail, sendWelcomeEmail } from "@/lib/mail";
import { resolveHints } from "@/lib/onboarding/hints";
import { rateLimit } from "@/lib/rate-limit";
import { billingAccount, company, companyMembership, user } from "@/schema";
import { createDraftCompany } from "@/server/trpc/helpers/setup-helpers";

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

/**
 * The language a Google signup was reading the site in, or null.
 *
 * Credentials signup posts its locale in the request body; an OAuth callback
 * has no body, so the cookie is the only thing carrying it. next-intl's
 * middleware sets NEXT_LOCALE on every page request rather than only on an
 * explicit switch (`GET /` answers `de`, `GET /en/pricing` answers `en`), so
 * this reflects the language they were actually reading, not just the language
 * they clicked. It is `SameSite=lax`, which is why it survives Google's
 * top-level redirect back to the callback.
 *
 * Null only if no page was loaded first, which in practice means a direct hit
 * on the callback URL; `resolveEmailLocale` then falls back to company.country.
 *
 * `cookies()` throws outside a request scope. The signIn callback always runs
 * inside one, so the catch is for the case that stops being true: a language
 * nobody can read is worth strictly less than a sign-in that completes.
 */
async function signupLocaleFromCookie(): Promise<LocaleCode | null> {
  try {
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE)?.value;
    return isLocaleCode(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * A sign-in that follows the promo link (?promo=…, remembered by proxy.ts for a
 * signed-out visitor) grandfathers the person (lib/billing/promo-grant.ts), then
 * forgets the code. The cookie lives a day and sign-out clears it (events.signOut
 * below), so the next person on a shared browser is not handed it. Any failure is
 * logged: a promo is worth strictly less than a sign-in that completes.
 */
async function applyPromoFromCookie(email: string): Promise<void> {
  try {
    const store = await cookies();
    const code = store.get(PROMO_COOKIE)?.value;
    if (code === undefined) return;
    if (isActivePromo(code, env)) await grandfatherByPromo(db, email, code);
    store.delete(PROMO_COOKIE);
  } catch (err) {
    console.error("[auth] promo not applied:", err);
  }
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_EMAIL = 10;
const LOGIN_MAX_PER_IP = 30;

/**
 * Per email caps guessing at one account; per IP caps one source trying a
 * password across many accounts, which the email key alone never slowed.
 * The IP goes first and stops the check, so a source over its budget no longer
 * counts against the emails it names and can lock out at most three accounts
 * per window. An "unknown" IP would put every visitor in one bucket, so it
 * gets the email cap only.
 */
async function isLoginAllowed(email: string, ip: string): Promise<boolean> {
  const byIp =
    ip === "unknown" ||
    (await rateLimit(`login:ip:${ip}`, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS));
  return (
    byIp &&
    (await rateLimit(`login:email:${email}`, LOGIN_MAX_PER_EMAIL, LOGIN_WINDOW_MS))
  );
}

type GoogleAdmission =
  | {
      readonly admitted: true;
      readonly userId: string;
      readonly isNew: boolean;
      /** Provision a draft company: a new account, or one Google just verified. */
      readonly provision: boolean;
    }
  | { readonly admitted: false; readonly error: GoogleSignInError | null };

/**
 * The account a verified Google sign-in enters, created or linked under the rule in
 * lib/auth/google-link.ts. A refusal with no error code is an edge the sign-in card has no
 * message for, and falls through to Auth.js's own AccessDenied page.
 */
async function admitGoogleAccount(google: {
  email: string;
  name: string;
  subject: string;
}): Promise<GoogleAdmission> {
  const now = new Date();

  // A Google account already linked under another address changed its address at Google (a
  // Workspace domain rename, say). Moving the account to the new address on Google's word alone
  // would hand it to whoever holds that address next, so a person decides.
  const linkedTo = await db.query.user.findFirst({
    where: eq(user.googleSubject, google.subject),
    columns: { email: true },
  });
  if (linkedTo && linkedTo.email !== google.email) {
    return { admitted: false, error: GOOGLE_SIGNIN_ERRORS.emailChanged };
  }

  // Atomic upsert: survives concurrent OAuth flows for the same new email (otherwise both lookups
  // miss, both inserts race, and the loser hits a unique-constraint 500 on /api/auth/callback). No
  // conflict target, so it also stands down when this Google account was linked to another
  // address since the lookup above, which leaves the lookup below with no row.
  const [created] = await db
    .insert(user)
    .values({
      email: google.email,
      name: google.name,
      // Google verified `profile.email_verified` upstream so we trust
      // the address — no separate OTP step for OAuth signups.
      emailVerifiedAt: now,
      googleSubject: google.subject,
      // /api/auth/register receives the locale in its POST body; an OAuth
      // callback has no body to put it in, so the cookie next-intl set
      // while they browsed is the only thing carrying it.
      locale: await signupLocaleFromCookie(),
    })
    .onConflictDoNothing()
    .returning({ id: user.id });
  if (created) {
    return { admitted: true, userId: created.id, isNew: true, provision: true };
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, google.email),
    columns: { id: true, googleSubject: true, passwordHash: true, emailVerifiedAt: true },
  });
  if (!existing) return { admitted: false, error: GOOGLE_SIGNIN_ERRORS.emailChanged };

  const decision = decideGoogleLink(existing, google.subject);
  if (decision.kind === "refuse") return { admitted: false, error: decision.error };
  if (decision.kind === "sign-in") {
    return { admitted: true, userId: existing.id, isNew: false, provision: false };
  }

  // Only while the account is still unlinked, so of two Google accounts racing for one address
  // only the first links. A subject already linked to a different account trips the unique index
  // instead; Auth.js turns that throw into AccessDenied.
  const linked = await db
    .update(user)
    .set({
      googleSubject: google.subject,
      updatedAt: now,
      ...(decision.clearPassword
        ? {
            passwordHash: null,
            // Audit F-5 (2026-09-10): removing the password is a credential
            // change, so it invalidates outstanding sessions the same way a
            // reset does (audit M-1). The jwt callback runs after this one
            // and re-reads sessionVersion, so THIS sign-in is stamped with
            // the incremented value and stays valid; only tokens issued
            // before the change are rejected.
            sessionVersion: sql`${user.sessionVersion} + 1`,
          }
        : {}),
      // A pending-verify account whose owner chose Google over the email code.
      ...(decision.markVerified ? { emailVerifiedAt: now } : {}),
    })
    .where(and(eq(user.id, existing.id), isNull(user.googleSubject)))
    .returning({ id: user.id });
  if (linked.length === 0) return { admitted: false, error: null };

  return {
    admitted: true,
    userId: existing.id,
    isNew: false,
    provision: decision.markVerified,
  };
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
    async authorize(credentials, request) {
      const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
      const password = credentials?.password as string | undefined;

      if (!email || !password) return null;
      if (password.length > 128) return null;

      // A coded error, not null: null reads as a wrong password, which sends
      // someone who is only rate limited off to reset a password that works.
      if (!(await isLoginAllowed(email, getClientIp(request.headers)))) {
        throw new CredentialsFlowError("RATE_LIMITED");
      }

      const dbUser = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      // Always run bcrypt.compare to prevent timing attacks
      const hash = dbUser?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(password, hash);

      if (!dbUser?.passwordHash || !valid) return null;

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
if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_AUTH === "true") {
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
    }),
  );
}

type StoredSessionVersion = { ok: true; version: number | null } | { ok: false };

/**
 * The stored session version for this email (null when the user is gone), or not ok when the
 * database could not be asked. Auth.js reads a throw in the jwt callback as "signed out" and clears
 * the cookie, so a database blip would otherwise end every session; getSession still refuses data
 * while the database is down. Only the error's name is logged, since a query error's message
 * carries its parameters, here the address.
 */
async function storedSessionVersion(email: string): Promise<StoredSessionVersion> {
  try {
    const stored = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { sessionVersion: true },
    });
    return { ok: true, version: stored?.sessionVersion ?? null };
  } catch (err) {
    console.error(
      "[auth] session version lookup failed, keeping the token:",
      err instanceof Error ? err.name : "unknown",
    );
    return { ok: false };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  // Audit EW-12 (2026-06-11): 8h dropped from 24h. This is an IDLE timeout,
  // not a lifetime: every read of /api/auth/session re-signs the JWT with a
  // fresh 8h expiry, so a session in use (or a copied cookie being polled)
  // never reaches it. The lifetime is the absolute 12h from sign-in that the
  // jwt callback below enforces (lib/auth/session-age.ts). Password reset and
  // sign-out revoke before either (audit M-1, sessionVersion).
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },

  pages: {
    signIn: "/auth/signin",
  },

  events: {
    async signOut(message) {
      // Sign-out revokes every session of the account, on all devices. A JWT
      // cannot be revoked on its own, and clearing this browser's cookie leaves
      // a copied one working, which is the session someone signing out most
      // wants gone.
      //
      // Only a token that is itself live may do it. Otherwise a copied cookie
      // that was already revoked or had aged out could still be posted here
      // and sign the owner out of the sessions that replaced it, again and
      // again. The version match sits in the UPDATE so a check and a bump
      // cannot interleave with another sign-out or a reset.
      const token = "token" in message ? message.token : null;
      if (
        token?.email &&
        token.sessionVersion !== undefined &&
        isWithinAbsoluteSessionAge(token.authTime ?? null, epochSeconds(new Date()))
      ) {
        try {
          await db
            .update(user)
            .set({ sessionVersion: sql`${user.sessionVersion} + 1` })
            .where(
              and(
                eq(user.email, token.email),
                eq(user.sessionVersion, token.sessionVersion),
              ),
            );
        } catch (err) {
          console.error("[auth] sessions not revoked on sign-out:", err);
        }
      }
      // A promo code a signed-out visitor opened must not pass to whoever signs in
      // next on this browser (lib/billing/promo.ts).
      try {
        (await cookies()).delete(PROMO_COOKIE);
      } catch (err) {
        console.error("[auth] promo cookie not cleared on sign-out:", err);
      }
    },
  },

  callbacks: {
    async signIn({ user: authUser, profile, account }) {
      if (!authUser.email) return false;

      if (account?.provider === "google") {
        // Only allow verified Google emails
        if (!profile?.email_verified) return false;

        // The OIDC subject, which Auth.js also passes as account.providerAccountId.
        // Read from the profile because providerAccountId falls back to a random
        // UUID when a profile carries no id, and linking to that would bind the
        // account to a Google identity nobody holds.
        const subject = profile.sub;
        if (!subject) return false;

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

        const admission = await admitGoogleAccount({
          email: authUser.email,
          name: newName,
          subject,
        });
        if (!admission.admitted) {
          // A returned path makes Auth.js redirect there without creating a
          // session (handleAuthorized in @auth/core), which is how the sign-in
          // card gets a code; `false` would land on its generic error page.
          return admission.error ? googleSignInErrorPath(admission.error) : false;
        }

        if (admission.isNew) {
          // Truly new user — notify admins + welcome.
          // Awaited so serverless doesn't terminate before send.
          const admins = [...getPlatformAdminEmails()];
          await Promise.all([
            admins.length > 0
              ? sendMail({
                  emailType: "internal.new_signup_alert",
                  to: admins,
                  ...newUserSignupEmail({
                    userEmail: authUser.email,
                    userName: newName,
                    provider: account.provider,
                  }),
                }).catch((err) =>
                  console.error("[auth] Failed to send admin signup alert:", err),
                )
              : Promise.resolve(),
            sendWelcomeEmail({ name: newName, email: authUser.email }).catch((err) =>
              console.error("[auth] Failed to send welcome email:", err),
            ),
          ]);
        }

        // Google users bypass the verify-email route, so this is their draft-
        // company provisioning boundary. Idempotent; a failure logs but never
        // blocks signin.
        if (admission.provision) {
          try {
            await createDraftCompany(db, admission.userId);
          } catch (err) {
            console.error("[auth] Failed to provision draft company:", err);
          }
        }
      }

      return true;
    },

    /**
     * Audit M-1 (2026-06-10): stamp the user's current sessionVersion
     * into the JWT at issue time so revocation can be detected.
     * `user` is only supplied on first sign-in (Credentials authorize
     * or OAuth sign-in); on subsequent token refreshes the stamped
     * version is what was canonical at issue time, which is exactly
     * what we want — a stale token whose version is below the live
     * user.sessionVersion gets rejected.
     *
     * Every other call is a read of an existing session, and Auth.js answers
     * it by re-signing the token with a fresh expiry. So this is where a stale
     * token has to end, not only be refused in getSession: returning null
     * makes Auth.js clear the cookie instead of renewing it, and auth() then
     * reports no session to every reader (PublicNav reads it directly). A
     * copied or revoked cookie can no longer be kept alive by polling.
     */
    async jwt({ token, user: authUser }) {
      if (authUser?.email) {
        // Same hook also counts the login. `authUser` is supplied only when a
        // session is first established, never on the silent refreshes that
        // keep the 8h token alive, so this is one increment per sign-in and
        // not one per request. Folded into the sessionVersion read as a single
        // UPDATE ... RETURNING: same round trip as before, and the increment
        // is atomic, so two concurrent sign-ins cannot land on one number.
        // lastLoginAt rides along: sessions are stateless JWTs, so this stamp
        // is the only durable last-sign-in fact (lifecycle emails read it).
        const [dbUser] = await db
          .update(user)
          .set({ loginCount: sql`${user.loginCount} + 1`, lastLoginAt: new Date() })
          .where(eq(user.email, authUser.email))
          .returning({ sessionVersion: user.sessionVersion });
        token.sessionVersion = dbUser?.sessionVersion ?? 1;
        // Stamped here and never again, so it stays the sign-in time however
        // often the token is re-signed (lib/auth/session-age.ts).
        token.authTime = epochSeconds(new Date());
        await applyPromoFromCookie(authUser.email);
        return token;
      }

      // The age needs no query, so it goes first.
      if (!isWithinAbsoluteSessionAge(token.authTime ?? null, epochSeconds(new Date()))) {
        return null;
      }
      if (!token.email) return null;
      const stored = await storedSessionVersion(token.email);
      if (!stored.ok) return token;
      return stored.version !== null &&
        isSessionVersionCurrent(token.sessionVersion ?? null, stored.version)
        ? token
        : null;
    },

    async session({ session, token }) {
      session.companyId = null;
      session.companyActivated = false;
      session.role = "member";
      session.jobTitle = null;
      session.accessLevel = null;
      session.sessionVersion = token.sessionVersion ?? null;
      session.authTime = token.authTime ?? null;
      session.hints = {
        journeyTourGuided: false,
        journeyTourTeam: false,
        requirementTour: false,
        helpOffer: false,
      };
      return session;
    },
  },
});

const openMembership = async (userId: string, companyId: string) => {
  const [row] = await db
    .select({
      role: companyMembership.role,
      jobTitle: companyMembership.jobTitle,
      activatedAt: company.activatedAt,
      accessLevel: billingAccount.accessLevel,
    })
    .from(companyMembership)
    .innerJoin(company, eq(company.id, companyMembership.companyId))
    .innerJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(
      and(
        eq(companyMembership.userId, userId),
        eq(companyMembership.companyId, companyId),
      ),
    )
    .limit(1);
  return row;
};

/**
 * Get the current session with fresh id/companyId/role from DB, and
 * verify the JWT's sessionVersion against the live user row (audit
 * M-1, 2026-06-10) so revoked tokens stop working. React cache()
 * ensures a single DB query per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const session = await auth();
  if (!session?.user?.email) return null;
  // auth() has already ended a stale token in the jwt callback. Both rules are
  // checked again here because this is the gate every data read goes through,
  // and it should not rest on one callback staying as it is. The age first:
  // an expired sign-in needs no query to refuse.
  if (!isWithinAbsoluteSessionAge(session.authTime, epochSeconds(new Date()))) {
    return null;
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, session.user.email),
    columns: {
      id: true,
      name: true,
      companyId: true,
      sessionVersion: true,
      loginCount: true,
      grandfatheredAt: true,
      journeyTourGuidedDismissedAt: true,
      journeyTourTeamDismissedAt: true,
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
  if (!isSessionVersionCurrent(session.sessionVersion, dbUser.sessionVersion)) {
    return null;
  }

  session.user.id = dbUser.id;
  // DB name wins over the JWT snapshot so an in-app name change (e.g. fixing
  // the name printed on a training certificate) shows up without re-login.
  session.user.name = dbUser.name;
  // Derived here rather than queried at the point of use: the row is already
  // loaded and cache()d for the request, so the one-time onboarding surfaces
  // cost no extra round trip on any page that renders them.
  session.hints = resolveHints(dbUser);

  // The role and the compliance role come from the membership in the open company, and activation is
  // resolved once here so every gate reads session.companyActivated (a draft
  // shell has a company but no activatedAt). An open company without a
  // membership gets no company and the least role rather than a guess.
  const open = dbUser.companyId
    ? await openMembership(dbUser.id, dbUser.companyId)
    : undefined;
  session.companyId = open ? dbUser.companyId : null;
  session.role = open?.role ?? "member";
  session.jobTitle = open?.jobTitle ?? null;
  session.companyActivated = open?.activatedAt != null;
  session.accessLevel = open
    ? effectiveAccessLevel(
        open.accessLevel,
        await isFeatureOn(db, "billing"),
        dbUser.grandfatheredAt !== null,
      )
    : null;

  return session;
});
