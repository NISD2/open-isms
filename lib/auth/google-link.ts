import type { user } from "@/schema";

/**
 * Whether a Google sign-in may enter an account that already exists for its address.
 *
 * Google lets more than one of its accounts claim the same verified address: a personal account
 * created on a work address before the company moved to Google Workspace keeps claiming it after
 * its owner has left. Trusting the address alone let any of them in, and removed the password on
 * the way. So an account records the one Google account (its OIDC `sub`) that may sign in.
 *
 * A verified password account takes a Google sign-in only where Google is authoritative for the
 * address: a Gmail address, or a Google Workspace account (Google's own rule, "Verify the Google ID
 * token on your server side"). There the Google account IS the mailbox, so no stale personal
 * account can hold it, and the password stays: the owner signs in either way. Anywhere else the
 * password account refuses Google, which is the stale-account case above. Without this, an owner
 * who signed up with a password on their Gmail address could never use Google, and a password
 * reset, which unlinks Google, locked them out of it for good.
 *
 * The one case where the address has to be enough is an account nobody has proven yet: no password,
 * or a password on an address that was never verified. The second is how a stranger squats an
 * address before its owner signs up, which is why that password is cleared when the owner arrives
 * through Google.
 */

/**
 * Whether Google hosts and vouches for this address: a `@gmail.com` address, or a Workspace account
 * (`hd` set). Only meaningful for an `email_verified` profile, which the sign-in callback already
 * demands.
 */
export function isGoogleAuthoritative(email: string, hostedDomain: unknown): boolean {
  return (
    email.toLowerCase().endsWith("@gmail.com") ||
    (typeof hostedDomain === "string" && hostedDomain !== "")
  );
}

/**
 * Codes the sign-in card turns into a message (components/auth/SignInCard.tsx). They travel in the
 * `error` query parameter of the redirect, so they are plain URL-safe strings.
 */
export const GOOGLE_SIGNIN_ERRORS = {
  passwordAccount: "GOOGLE_PASSWORD_ACCOUNT",
  subjectMismatch: "GOOGLE_ACCOUNT_MISMATCH",
  /** The Google account is linked to an account under a different address. */
  emailChanged: "GOOGLE_EMAIL_CHANGED",
} as const;

export type GoogleSignInError =
  (typeof GOOGLE_SIGNIN_ERRORS)[keyof typeof GOOGLE_SIGNIN_ERRORS];

const GOOGLE_SIGNIN_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(GOOGLE_SIGNIN_ERRORS),
);

export function isGoogleSignInError(value: string | null): value is GoogleSignInError {
  return value !== null && GOOGLE_SIGNIN_ERROR_CODES.has(value);
}

export type GoogleLinkAccount = Pick<
  typeof user.$inferSelect,
  "googleSubject" | "passwordHash" | "emailVerifiedAt"
>;

export type GoogleLinkDecision =
  | { readonly kind: "sign-in" }
  | {
      readonly kind: "link";
      readonly clearPassword: boolean;
      readonly markVerified: boolean;
    }
  | { readonly kind: "refuse"; readonly error: GoogleSignInError };

/** The Google account signing in: its OIDC `sub`, and whether Google vouches for the address. */
export interface IncomingGoogle {
  readonly subject: string;
  readonly authoritative: boolean;
}

export function decideGoogleLink(
  account: GoogleLinkAccount,
  incoming: IncomingGoogle,
): GoogleLinkDecision {
  if (account.googleSubject !== null) {
    return account.googleSubject === incoming.subject
      ? { kind: "sign-in" }
      : { kind: "refuse", error: GOOGLE_SIGNIN_ERRORS.subjectMismatch };
  }
  const hasPassword = account.passwordHash !== null;
  const verified = account.emailVerifiedAt !== null;
  if (hasPassword && verified) {
    return incoming.authoritative
      ? { kind: "link", clearPassword: false, markVerified: false }
      : { kind: "refuse", error: GOOGLE_SIGNIN_ERRORS.passwordAccount };
  }
  return { kind: "link", clearPassword: hasPassword, markVerified: !verified };
}

/** Where a refused Google sign-in lands: the sign-in card, carrying the code it explains. */
export function googleSignInErrorPath(error: GoogleSignInError): string {
  return `/auth/signin?${new URLSearchParams({ error })}`;
}
