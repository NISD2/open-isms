import { and, eq, isNull } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { OtpRateLimitedError, requestOtp } from "@/lib/auth/otp";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { isLocaleCode } from "@/lib/locale";
import { sendAuthCode } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import type { Locale } from "@/lib/seo";
import { user } from "@/schema";

/**
 * Resend the email-verification OTP for a pending-verify account.
 *
 * Does not reveal whether the email exists, is pending or is already
 * verified: every address gets the same 200, and it goes out before the
 * address is looked up. The lookup, the code and the mail run in `after()`,
 * the same as /api/auth/register and /api/auth/forgot-password, so neither
 * the body nor the time it takes differs. The OTP service's own rate-limit
 * (3 per email per 5 min) is the operational cap; past it no mail is sent and
 * the answer is the same.
 *
 * POST /api/auth/resend-verification
 *   body: { email: string, locale?: LocaleCode }
 *   200:  { success: true }
 *   400:  { error: "..." }   // malformed body or address only
 */
export async function POST(request: Request) {
  // Per IP, as the other auth routes: the answer no longer says whether a code went out, so this is
  // the only brake on using the route to mail pending addresses. It applies to every caller alike
  // and reveals nothing about any address.
  if (
    !(await rateLimit(
      `auth:resend-verification:${getClientIp(request.headers)}`,
      10,
      15 * 60_000,
    ))
  ) {
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
  const localeInput = body.locale as string | undefined;
  // Full app-locale validation: the OTP templates carry all 10 locales.
  const locale: Locale = isLocaleCode(localeInput) ? localeInput : "de";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  after(() => resendCode(email, locale));

  return NextResponse.json({ success: true });
}

async function resendCode(email: string, locale: Locale): Promise<void> {
  try {
    const pendingUser = await db.query.user.findFirst({
      where: and(eq(user.email, email), isNull(user.emailVerifiedAt)),
      // Only what this route reads: existence, and the gate's verdict (audit
      // F-9 — a row lookup should not drag back columns nobody uses).
      columns: { isDisposableEmail: true },
    });
    if (!pendingUser) return;

    // Blocked at sign-up, so no code is issued here either.
    //
    // lib/auth/email-quality.ts states the gate's contract as "no OTP is issued
    // and Google sign-in is refused", and /api/auth/register and the Google
    // callback both honour it: each records the attempt with
    // isDisposableEmail = true and then declines to issue anything. This route
    // did not, and it is the only other place that mints an email_verify code,
    // so the whole gate was one request from being decorative: register with a
    // disposable address (row written, no code), then ask here (code sent), then
    // verify. The row already carries the verdict, so honouring it costs a
    // column rather than a second DNS and RDAP round trip.
    if (pendingUser.isDisposableEmail) {
      console.log(
        "[resend-verification] Silent block (disposable):",
        email.split("@")[1],
      );
      return;
    }

    const { code } = await requestOtp(email, "email_verify");
    await sendAuthCode({ to: email, code, locale, kind: "verification" });
  } catch (err) {
    // Past the per-email code limit: no mail, and the response already went out.
    if (err instanceof OtpRateLimitedError) return;
    console.error("[resend-verification] OTP/send failed:", err);
  }
}
