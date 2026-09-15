import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { OtpRateLimitedError, requestOtp } from "@/lib/auth/otp";
import { db } from "@/lib/db";
import { isLocaleCode } from "@/lib/locale";
import { sendAuthCode } from "@/lib/mail";
import type { Locale } from "@/lib/seo";
import { user } from "@/schema";

/**
 * Resend the email-verification OTP for a pending-verify account.
 *
 * Deliberately does not reveal whether the email exists or is already
 * verified — both cases return the same generic success response, so the
 * endpoint can't be used to enumerate accounts. The OTP service's own
 * rate-limit (3 per email per 5 min) provides the operational cap.
 *
 * POST /api/auth/resend-verification
 *   body: { email: string, locale?: "de" | "en" | "nl" }
 *   200:  { success: true }
 *   429:  { error: "Rate limited" }
 */
export async function POST(request: Request) {
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

  const pendingUser = await db.query.user.findFirst({
    where: and(eq(user.email, email), isNull(user.emailVerifiedAt)),
    // Only what this route reads: existence, and the gate's verdict (audit
    // F-9 — a row lookup should not drag back columns nobody uses).
    columns: { isDisposableEmail: true },
  });

  // No pending-verify account? Pretend success. Don't leak existence.
  if (!pendingUser) {
    return NextResponse.json({ success: true });
  }

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
  //
  // Same generic success shape as every other branch. Anything that
  // distinguishes "blocked" from "sent" hands back an oracle for which domains
  // the list covers (audit H-4).
  if (pendingUser.isDisposableEmail) {
    console.log("[resend-verification] Silent block (disposable):", email.split("@")[1]);
    return NextResponse.json({ success: true });
  }

  try {
    const { code } = await requestOtp(email, "email_verify");
    await sendAuthCode({ to: email, code, locale, kind: "verification" }).catch((err) =>
      console.error("[resend-verification] Failed to send email:", err),
    );
  } catch (err) {
    if (err instanceof OtpRateLimitedError) {
      return NextResponse.json(
        { error: "Too many verification emails. Please wait a few minutes." },
        { status: 429 },
      );
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
