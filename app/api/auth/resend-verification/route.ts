import { NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { sendAuthCode } from "@/lib/mail";
import { requestOtp, OtpRateLimitedError } from "@/lib/auth/otp";

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
  const locale: "de" | "en" | "nl" =
    localeInput === "en" || localeInput === "nl" ? localeInput : "de";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const pendingUser = await db.query.user.findFirst({
    where: and(eq(user.email, email), isNull(user.emailVerifiedAt)),
  });

  // No pending-verify account? Pretend success. Don't leak existence.
  if (!pendingUser) {
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
