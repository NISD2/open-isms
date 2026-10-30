import { signIn } from "next-auth/react";

/** What a sign-in with a code came to, as the card shows it. */
export type CodeSignInResult =
  | "ok"
  | "invalid"
  | "rateLimited"
  | "unavailable"
  | "setupRequired"
  | "codeRequired"
  | "failed";

/**
 * The password sign-in with a code from the app (or a recovery code) riding along: the server
 * checks both in one go and only then makes a session (lib/auth/two-factor/sign-in.ts). The codes
 * come back as NextAuth forwards them, in `code` or folded into `error`.
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

/** The card's reading of any password sign-in's answer, with or without a code. */
export function readSignInResult(
  result: { error?: string | null; code?: string | null } | undefined,
): CodeSignInResult {
  if (result && !result.error) return "ok";
  const raw = `${result?.error ?? ""} ${result?.code ?? ""}`;
  if (raw.includes("RATE_LIMITED")) return "rateLimited";
  if (raw.includes("TWO_FACTOR_SETUP_REQUIRED")) return "setupRequired";
  if (raw.includes("TWO_FACTOR_REQUIRED")) return "codeRequired";
  if (raw.includes("TWO_FACTOR_INVALID")) return "invalid";
  if (raw.includes("TWO_FACTOR_UNAVAILABLE")) return "unavailable";
  return "failed";
}
