import "@/lib/server-guard";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { user } from "@/schema";

// Dummy hash for timing-safe comparison when user doesn't exist
const DUMMY_HASH = "$2a$12$000000000000000000000uGBYRMjo5lsWIKE/k.HdGZfR5YmKKKu";

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

export type PasswordAccount = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly companyId: string | null;
};

export type PasswordCheck =
  | { readonly ok: true; readonly user: PasswordAccount }
  | { readonly ok: false; readonly reason: "rate_limited" | "invalid" | "unverified" };

/**
 * The password sign-in's own check, shared by the sign-in and by setting up the second factor
 * before one (app/api/auth/two-factor/setup), so both count against the same login budget.
 * Email was proven owned at registration (verify-email OTP); an account not verified yet is
 * refused with its own reason, which the sign-in turns into the verify step.
 */
export async function checkPassword(
  db: DbOrTx,
  rawEmail: string | undefined,
  password: string | undefined,
  ip: string,
): Promise<PasswordCheck> {
  const email = rawEmail?.toLowerCase().trim();
  if (!email || !password || password.length > 128)
    return { ok: false, reason: "invalid" };

  if (!(await isLoginAllowed(email, ip))) return { ok: false, reason: "rate_limited" };

  const dbUser = await db.query.user.findFirst({ where: eq(user.email, email) });

  // Always run bcrypt.compare to prevent timing attacks
  const valid = await bcrypt.compare(password, dbUser?.passwordHash ?? DUMMY_HASH);
  if (!dbUser?.passwordHash || !valid) return { ok: false, reason: "invalid" };

  // Google OAuth users don't go through this branch and are implicitly trusted because Google
  // verifies profile.email_verified upstream.
  if (!dbUser.emailVerifiedAt) return { ok: false, reason: "unverified" };

  return {
    ok: true,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      companyId: dbUser.companyId,
    },
  };
}
