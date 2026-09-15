import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth/otp";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { newUserSignupEmail, sendMail, sendWelcomeEmail } from "@/lib/mail";
import { user } from "@/schema";
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
 *   body: { email: string, code: string, password?: string }
 *   200:  { success: true }
 *   400:  { error: "Invalid code" }
 *   404:  { error: "Account not found" } (only if the user truly doesn't exist
 *                                          and the code is otherwise valid —
 *                                          which is impossible since OTPs are
 *                                          email-scoped. Kept for type safety.)
 *   429:  { error: "Too many attempts" }
 *
 * Why `password` is accepted here, and why that is not a regression of audit
 * C-1. /api/auth/register refuses to touch passwordHash on an account that
 * already exists and is pending verification, because a POST to /register
 * carries no proof that the sender owns the address — without that refusal,
 * re-registering someone else's unverified address with your own password
 * hands you their account.
 *
 * The consequence was that a second registration kept the FIRST password
 * silently. The card then verified the code (which worked) and signed in with
 * the password the person had just typed (which could not work), so a correct
 * code ended on "Something went wrong" and the account was left verified under
 * a password nobody knew. Re-registering is not an edge case: it is what
 * someone does after mistyping the password, or after forgetting they started
 * a signup weeks ago.
 *
 * Submitting the correct OTP IS the missing ownership proof — the same proof
 * /api/auth/reset-password accepts to set a password outright. So the password
 * travels with the code rather than ahead of it, which is the part that
 * matters: an attacker who re-registers a pending address still changes
 * nothing, because the write happens only in the request that carries a code
 * they cannot read. The write is also fused to the `isNull(emailVerifiedAt)`
 * guard below, so this can never act on an already-live account.
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
  const password = body.password as string | undefined;

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Same bounds /api/auth/register enforces. A password outside them is the
  // caller's bug, not something to silently ignore and then fail to sign in on.
  if (password !== undefined && (password.length < 8 || password.length > 128)) {
    return NextResponse.json(
      { error: "Password must be 8-128 characters" },
      { status: 400 },
    );
  }

  const valid = await verifyOtp(email, code, "email_verify");
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  // Mark the (still-unverified) user as verified, and commit the password
  // typed on the screen that produced this code. If a later concurrent
  // request also lands, the `isNull` guard makes the second update a no-op
  // which is the desired idempotent behavior — and it is the same guard that
  // keeps the password write off an already-verified account.
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

  const updated = await db
    .update(user)
    .set({
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
      ...(passwordHash ? { passwordHash } : {}),
    })
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
            emailType: "internal.new_signup_alert",
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
