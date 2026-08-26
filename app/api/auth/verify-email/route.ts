import { NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { verifyOtp } from "@/lib/auth/otp";
import { sendMail, sendWelcomeEmail, newUserSignupEmail } from "@/lib/mail";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { getClientIp } from "@/lib/client-ip";
import { createDraftCompany } from "@/server/trpc/helpers/setup-helpers";

// In-memory rate limit: max 10 verification attempts per IP per 15 min.
// Per-OTP attempts are already capped server-side at 5 in `verifyOtp`,
// so this exists primarily to slow down enumeration across many emails.
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
 * Verify an email address by submitting the 6-digit code from the
 * registration OTP email. On success the user becomes signin-eligible
 * (Credentials.authorize() unblocks them) and admin / welcome emails fire.
 *
 * POST /api/auth/verify-email
 *   body: { email: string, code: string }
 *   200:  { success: true }
 *   400:  { error: "Invalid code" }
 *   404:  { error: "Account not found" } (only if the user truly doesn't exist
 *                                          and the code is otherwise valid —
 *                                          which is impossible since OTPs are
 *                                          email-scoped. Kept for type safety.)
 *   429:  { error: "Too many attempts" }
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
  const code = body.code as string | undefined;

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code are required" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const valid = await verifyOtp(email, code, "email_verify");
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  // Mark the (still-unverified) user as verified. We only flip the column;
  // if a later concurrent request also lands, the `isNull` guard makes the
  // second update a no-op which is the desired idempotent behavior.
  const updated = await db
    .update(user)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(user.email, email), isNull(user.emailVerifiedAt)))
    .returning({ id: user.id, name: user.name });

  // First-time verification → fire admin + welcome notifications.
  // If the user was already verified somehow (shouldn't happen given the OTP
  // is single-use, but defensive), `updated` will be empty and we skip.
  if (updated.length > 0) {
    const userRow = updated[0]!;

    // Auto-provision a draft company so the NIS2 journey renders at first login
    // (the user activates it in-journey). This is the correct provisioning
    // boundary: post-OTP the email is proven-owned and disposable signups never
    // reach here (they were never issued an OTP). createDraftCompany is
    // idempotent, and the isNull(emailVerifiedAt) guard above already makes this
    // block run exactly once per user. A failure just logs (the user is
    // verified regardless, and onboarding still works).
    try {
      await createDraftCompany(db, userRow.id);
    } catch (err) {
      console.error("[verify-email] Failed to provision draft company:", err);
    }

    const admins = [...getPlatformAdminEmails()];
    await Promise.all([
      admins.length > 0
        ? sendMail({
            to: admins,
            ...newUserSignupEmail({
              userEmail: email,
              userName: userRow.name,
              provider: "credentials",
            }),
          }).catch((err) =>
            console.error("[verify-email] Failed to send admin signup alert:", err),
          )
        : Promise.resolve(),
      sendWelcomeEmail({ name: userRow.name, email }).catch((err) =>
        console.error("[verify-email] Failed to send welcome email:", err),
      ),
    ]);
  }

  return NextResponse.json({ success: true });
}
