import "@/lib/server-guard";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { revokedByCredentialChange } from "@/lib/auth/credential-change";
import {
  decideGoogleLink,
  GOOGLE_SIGNIN_ERRORS,
  type GoogleSignInError,
} from "@/lib/auth/google-link";
import { db } from "@/lib/db";
import { isLocaleCode, LOCALE_COOKIE, type LocaleCode } from "@/lib/locale";
import { user } from "@/schema";

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
export async function signupLocaleFromCookie(): Promise<LocaleCode | null> {
  try {
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE)?.value;
    return isLocaleCode(value) ? value : null;
  } catch {
    return null;
  }
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
export async function admitGoogleAccount(google: {
  email: string;
  name: string;
  subject: string;
  authoritative: boolean;
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

  const decision = decideGoogleLink(existing, google);
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
            // before the change are rejected. Assistants' keys end with it.
            ...revokedByCredentialChange(),
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
