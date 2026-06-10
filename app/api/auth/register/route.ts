import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { sendMail, emailVerificationCodeEmail } from "@/lib/mail";
import { requestOtp, OtpRateLimitedError } from "@/lib/auth/otp";
import { checkEmailQuality } from "@/lib/auth/email-quality";

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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

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

  // Treat existing unverified accounts as "still in signup" — allow re-sending
  // the OTP rather than blocking with "already exists". This is the common case
  // when a user closes the tab between register and verify-email.
  const userExistsAndVerified = existing && existing.emailVerifiedAt;
  if (userExistsAndVerified) {
    // Generic message to prevent email enumeration
    return NextResponse.json(
      { error: "Unable to create account. Please try signing in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const name = email.split("@")[0];
  const quality = await checkEmailQuality(email);
  const disposable = quality.block;

  if (existing) {
    // Pending-verify account exists. Refresh the password (user may have
    // retyped a different one) but do not announce admin signup again.
    await db
      .update(user)
      .set({ passwordHash, isDisposableEmail: disposable, updatedAt: new Date() })
      .where(eq(user.id, existing.id));
  } else {
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

  await sendMail({
    to: email,
    ...emailVerificationCodeEmail({ code, locale }),
  }).catch((err) =>
    console.error("[register] Failed to send verification email:", err),
  );

  return NextResponse.json({ success: true, verificationRequired: true });
}
