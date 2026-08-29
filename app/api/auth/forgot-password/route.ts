import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { requestOtp, OtpRateLimitedError } from "@/lib/auth/otp";
import { sendAuthCode } from "@/lib/mail";
import { isDisposableEmail } from "@/lib/auth/disposable";
import { getClientIp } from "@/lib/client-ip";

// In-memory IP rate limit. Matches the pattern used by /api/auth/register.
// Per-email rate limiting lives in requestOtp itself.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

/**
 * Request a password-reset code by email.
 *
 * Always returns 200 with the same shape regardless of whether the email
 * exists or has a password set. This prevents user enumeration: an
 * attacker can't tell from the response whether the address is a
 * registered credentials account, an OAuth-only account, or unknown.
 *
 * POST /api/auth/forgot-password
 *   body: { email: string, locale?: "de" | "en" | "nl" }
 *   200:  { success: true }    // Always (unless rate-limited)
 *   429:  { error: "..." }     // Per-IP only; per-email handled silently
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email as string | undefined)?.toLowerCase().trim();
  const rawLocale = body.locale as string | undefined;
  const locale: "de" | "en" | "nl" =
    rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Shape validation only — still return the generic success shape so
    // an attacker can't distinguish "malformed email" from "no such user".
    return NextResponse.json({ success: true });
  }

  // Disposable: pretend success, do nothing. Parity with register.
  if (isDisposableEmail(email)) {
    return NextResponse.json({ success: true });
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true, passwordHash: true },
  });

  // Only send a code if a credentials account actually exists. OAuth-only
  // users (no passwordHash) can't reset what they don't have; they sign
  // in via Google. Silent no-op preserves enumeration resistance.
  if (!dbUser || !dbUser.passwordHash) {
    return NextResponse.json({ success: true });
  }

  try {
    const { code } = await requestOtp(email, "password_reset");
    await sendAuthCode({ to: email, code, locale, kind: "password-reset" });
  } catch (err) {
    if (err instanceof OtpRateLimitedError) {
      // Silent — we still return success to keep enumeration resistance.
      // The rate-limiter inside requestOtp protects against per-email abuse.
      return NextResponse.json({ success: true });
    }
    console.error("[forgot-password] OTP/send failed:", err);
    // Still return success: the user can retry, and we don't want to
    // signal "this email exists but the mailer failed" to anyone fishing.
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true });
}
