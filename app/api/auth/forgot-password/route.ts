import { eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { isDisposableEmail } from "@/lib/auth/disposable";
import { OtpRateLimitedError, requestOtp } from "@/lib/auth/otp";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { isLocaleCode } from "@/lib/locale";
import { sendAuthCode } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import type { Locale } from "@/lib/seo";
import { user } from "@/schema";

// Per-IP rate limit. Matches the pattern used by /api/auth/register.
// Per-email rate limiting lives in requestOtp itself.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Request a password-reset code by email.
 *
 * Always returns 200 with the same body regardless of whether the email
 * exists or has a password set, and returns it before looking the address
 * up: the lookup, the code and the mail run after the response (`after()`),
 * so neither the body nor the time it takes tells an attacker whether the
 * address has an account.
 *
 * POST /api/auth/forgot-password
 *   body: { email: string, locale?: LocaleCode }
 *   200:  { success: true }    // Always (unless rate-limited)
 *   429:  { error: "..." }     // Per-IP only; per-email handled silently
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (!(await rateLimit(`auth:forgot-password:${ip}`, MAX_ATTEMPTS, WINDOW_MS))) {
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
  // Full app-locale validation: the OTP templates carry all 10 locales.
  const locale: Locale = isLocaleCode(rawLocale) ? rawLocale : "de";

  // A malformed address gets the same answer, so it cannot be told apart from
  // "no such user" either.
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    after(() => sendResetCode(email, locale));
  }

  return NextResponse.json({ success: true });
}

async function sendResetCode(email: string, locale: Locale): Promise<void> {
  // Disposable: do nothing. Parity with register.
  if (isDisposableEmail(email)) return;

  try {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { passwordHash: true, emailVerifiedAt: true },
    });

    // A password account, or a verified one without a password (signed up
    // through Google). The second is served too: the code proves control of
    // the mailbox, and without it an owner who lost the Google account, or
    // was refused because another Google account got linked first, has no
    // way back in. An unverified account with no password has proven nothing
    // and has nothing to reset.
    if (!dbUser || (dbUser.passwordHash === null && dbUser.emailVerifiedAt === null)) {
      return;
    }

    const { code } = await requestOtp(email, "password_reset");
    await sendAuthCode({ to: email, code, locale, kind: "password-reset" });
  } catch (err) {
    // Rate limited inside requestOtp: silent, the response already went out.
    if (err instanceof OtpRateLimitedError) return;
    console.error("[forgot-password] OTP/send failed:", err);
  }
}
