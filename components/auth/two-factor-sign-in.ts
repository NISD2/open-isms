import { signIn } from "next-auth/react";
import type { SignInRefusal } from "@/lib/auth/two-factor/sign-in";

/** What a sign-in with a code came to, as the card shows it. */
export type CodeSignInResult =
  | "ok"
  | "invalid"
  | "rateLimited"
  | "unreadable"
  | "setupRequired"
  | "codeRequired"
  | "locked"
  | "failed";

/**
 * The password sign-in with a code from the app (or a recovery code) riding along: the server
 * checks both in one go and only then makes a session (lib/auth/two-factor/sign-in.ts).
 */
export async function signInWithCode(
  email: string,
  password: string,
  totpCode: string,
): Promise<CodeSignInResult> {
  const result = await signIn("credentials", {
    email,
    password,
    totpCode,
    redirect: false,
  });
  return readSignInResult(result);
}

/** How the card reads each refusal the server sends (lib/auth/two-factor/sign-in.ts). */
const READ_REFUSAL = {
  RATE_LIMITED: "rateLimited",
  // The sign-in card handles this one itself, on the sign-in's own answer.
  EMAIL_NOT_VERIFIED: "failed",
  TWO_FACTOR_REQUIRED: "codeRequired",
  TWO_FACTOR_INVALID: "invalid",
  TWO_FACTOR_SETUP_REQUIRED: "setupRequired",
  TWO_FACTOR_LOCKED: "locked",
  TWO_FACTOR_UNREADABLE: "unreadable",
} as const satisfies Record<SignInRefusal, CodeSignInResult>;

const isRefusal = (code: string): code is SignInRefusal =>
  Object.hasOwn(READ_REFUSAL, code);

/**
 * The card's reading of any password sign-in's answer, with or without a code. NextAuth puts the
 * refusal the server threw in `code` (`error` is then "CredentialsSignin"); anything else failed.
 */
export function readSignInResult(
  result: { error?: string | null; code?: string | null } | undefined,
): CodeSignInResult {
  if (result && !result.error) return "ok";
  const code = result?.code;
  return code && isRefusal(code) ? READ_REFUSAL[code] : "failed";
}

/**
 * The step a password sign-in leads to when the password was right but a code is still needed:
 * the code step, or the setup step for someone who must have the app and has none. Null for any
 * other answer. Every card that signs in with a password routes through this.
 */
export function codeStepAfter(
  result: { error?: string | null; code?: string | null } | undefined,
): "code" | "setup" | null {
  const read = readSignInResult(result);
  if (read === "codeRequired") return "code";
  if (read === "setupRequired") return "setup";
  return null;
}
