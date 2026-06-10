import "@/lib/server-guard";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOtp } from "@/schema";

/**
 * Email-based one-time-password substrate.
 *
 * Used by:
 *  - Signup email verification (purpose "email_verify")
 *  - Password reset (purpose "password_reset")
 *
 * Security properties:
 *  - 6-digit codes from a CSPRNG (Node `crypto.randomInt`)
 *  - bcrypt-hashed at rest, never stored in plaintext
 *  - 10-minute hard expiry
 *  - 5 wrong attempts triggers lockout (record consumed)
 *  - Rate-limited: max 3 requests per email+purpose per 5 minutes
 *  - Each new request invalidates prior unconsumed records for the same
 *    (email, purpose), so the most recent code is always the only valid one
 *  - The caller (API route) is responsible for sending the plaintext code
 *    via Resend; this module never touches the mailer to keep concerns clean
 */

const CODE_LENGTH = 6;
const EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const BCRYPT_ROUNDS = 10;

const VALID_PURPOSES = ["email_verify", "password_reset"] as const;
export type OtpPurpose = (typeof VALID_PURPOSES)[number];

export class OtpRateLimitedError extends Error {
  constructor() {
    super("RATE_LIMITED");
    this.name = "OtpRateLimitedError";
  }
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Generate a uniformly-distributed 6-digit code as a string. */
function generateCode(): string {
  // randomInt is upper-exclusive: [10^5, 10^6) → 100000..999999 inclusive
  const min = 10 ** (CODE_LENGTH - 1);
  const max = 10 ** CODE_LENGTH;
  return String(randomInt(min, max));
}

/**
 * Generate a fresh OTP for `email` + `purpose`, persist its hash, return the
 * plaintext code so the caller can send it via email.
 *
 * Throws `OtpRateLimitedError` if more than `RATE_LIMIT_MAX` requests were
 * made for the same (email, purpose) in the last `RATE_LIMIT_WINDOW_MS`.
 */
export async function requestOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<{ code: string }> {
  const normalizedEmail = normalizeEmail(email);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recent = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailOtp)
    .where(
      and(
        eq(emailOtp.email, normalizedEmail),
        eq(emailOtp.purpose, purpose),
        gt(emailOtp.createdAt, windowStart),
      ),
    );

  if ((recent[0]?.count ?? 0) >= RATE_LIMIT_MAX) {
    throw new OtpRateLimitedError();
  }

  // Invalidate any prior unconsumed records so only the freshest code is valid
  await db
    .update(emailOtp)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailOtp.email, normalizedEmail),
        eq(emailOtp.purpose, purpose),
        isNull(emailOtp.consumedAt),
      ),
    );

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await db.insert(emailOtp).values({
    email: normalizedEmail,
    codeHash,
    purpose,
    expiresAt,
  });

  return { code };
}

/**
 * Verify a submitted plaintext code against the active OTP for
 * `email` + `purpose`. Returns `true` on success.
 *
 * On any failure path (no active record, wrong code, expired, locked) the
 * function returns `false` without revealing which case occurred — caller
 * shows a generic error. Wrong-code attempts are tracked; the
 * `MAX_ATTEMPTS`-th wrong attempt consumes the record so further guesses
 * cannot succeed even if the user later types the right code.
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  // Cheap shape check — we only issue 6-digit codes, anything else is junk
  if (!/^\d{6}$/.test(code)) return false;

  const record = await db.query.emailOtp.findFirst({
    where: and(
      eq(emailOtp.email, normalizedEmail),
      eq(emailOtp.purpose, purpose),
      isNull(emailOtp.consumedAt),
      gt(emailOtp.expiresAt, new Date()),
    ),
  });

  if (!record) return false;

  if (record.attempts >= MAX_ATTEMPTS) {
    await db
      .update(emailOtp)
      .set({ consumedAt: new Date() })
      .where(eq(emailOtp.id, record.id));
    return false;
  }

  const valid = await bcrypt.compare(code, record.codeHash);

  if (!valid) {
    await db
      .update(emailOtp)
      .set({ attempts: record.attempts + 1 })
      .where(eq(emailOtp.id, record.id));
    return false;
  }

  await db
    .update(emailOtp)
    .set({ consumedAt: new Date() })
    .where(eq(emailOtp.id, record.id));
  return true;
}

/**
 * Cron-friendly cleanup. Removes OTP rows older than 24h. Active records
 * inside that window are kept so we don't race with in-flight verifications.
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db.delete(emailOtp).where(lt(emailOtp.createdAt, cutoff));
  return result.rowCount ?? 0;
}
