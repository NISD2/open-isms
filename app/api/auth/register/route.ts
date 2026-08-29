import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { sendAuthCode } from "@/lib/mail";
import { requestOtp, OtpRateLimitedError } from "@/lib/auth/otp";
import { checkEmailQuality } from "@/lib/auth/email-quality";
import { getClientIp } from "@/lib/client-ip";

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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
 * Registration with email verification.
 *
 * Flow:
 *   POST /api/auth/register { email, password }
 *     → creates user with `emailVerifiedAt: null` (or no-ops if pending verify)
 *     → sends 6-digit OTP via email
 *     → returns 200 { verificationRequired: true }
 *
 *   client then collects the code from the user and POSTs to
 *   /api/auth/verify-email { email, code }
 *
 *   only then can the user sign in via Credentials — `authorize()` blocks
 *   accounts with a null `emailVerifiedAt`.
 *
 * Locale comes from a cookie or header so the email arrives in the right
 * language. Defaults to "de" for the German market.
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
  const password = body.password as string | undefined;
  const localeInput = body.locale as string | undefined;
  const locale: "de" | "en" | "nl" =
    localeInput === "en" || localeInput === "nl" ? localeInput : "de";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  if (email.length > 255) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be 8-128 characters" },
      { status: 400 },
    );
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  // Verified account: return the same generic success shape as every other
  // branch. Anything that distinguishes "this email is taken" from the
  // happy path leaks an enumeration oracle (audit H-4). Forgotten password
  // belongs in /api/auth/forgot-password, which proves mailbox ownership
  // before mutating anything.
  if (existing && existing.emailVerifiedAt) {
    return NextResponse.json({ success: true, verificationRequired: true });
  }

  const quality = await checkEmailQuality(email);
  const disposable = quality.block;

  if (existing) {
    // Pending-verify account exists. Re-issue the OTP so the user can
    // finish signing up if they lost the original mail. CRITICAL (audit
    // C-1): never overwrite passwordHash here. Without an ownership
    // proof the overwrite lets an attacker hijack any not-yet-verified
    // address by simply re-POSTing /register with their own password.
    // Forgotten-password recovery belongs in /api/auth/forgot-password,
    // which proves mailbox control via OTP before mutating the password.
    await db
      .update(user)
      .set({ isDisposableEmail: disposable, updatedAt: new Date() })
      .where(eq(user.id, existing.id));
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const name = email.split("@")[0];
    // onConflictDoNothing guards against two concurrent registrations for the
    // same new email racing past the findFirst check and both attempting the
    // insert — without this the loser hits a unique-constraint 500.
    await db.insert(user).values({
      email,
      name,
      passwordHash,
      role: "member",
      isDisposableEmail: disposable,
      // emailVerifiedAt left null — set by /api/auth/verify-email
    }).onConflictDoNothing({ target: user.email });
  }

  // Disposable email: user record is kept so we can see the scoping/bot
  // signup in admin, but we never issue an OTP. The account stays
  // permanently unverified and unable to sign in. Response shape matches
  // the happy path to avoid leaking which domains are blocked.
  if (disposable) {
    console.log(
      `[register] Silent block (${quality.reason}):`,
      email.split("@")[1],
    );
    return NextResponse.json({ success: true, verificationRequired: true });
  }

  // Issue the OTP and email it. Rate-limited inside requestOtp itself.
  let code: string;
  try {
    ({ code } = await requestOtp(email, "email_verify"));
  } catch (err) {
    if (err instanceof OtpRateLimitedError) {
      return NextResponse.json(
        { error: "Too many verification emails. Please wait a few minutes and try again." },
        { status: 429 },
      );
    }
    throw err;
  }

  await sendAuthCode({ to: email, code, locale, kind: "verification" }).catch((err) =>
    console.error("[register] Failed to send verification email:", err),
  );

  return NextResponse.json({ success: true, verificationRequired: true });
}
