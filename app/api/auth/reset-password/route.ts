import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { verifyOtp } from "@/lib/auth/otp";
import { getClientIp } from "@/lib/client-ip";

// In-memory IP rate limit. Per-OTP attempts are capped server-side at 5
// inside verifyOtp; this exists to slow enumeration across emails.
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
 * Complete a password reset by submitting the OTP from the
 * forgot-password email together with the new password.
 *
 * On success the new password hash replaces the old one and
 * emailVerifiedAt is set (proving control of the address) so the user
 * can sign in immediately with the new password.
 *
 * POST /api/auth/reset-password
 *   body: { email: string, code: string, newPassword: string }
 *   200:  { success: true }
 *   400:  { error: "..." }
 *   429:  { error: "..." }
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
  const newPassword = body.newPassword as string | undefined;

  if (!email || !code || !newPassword) {
    return NextResponse.json(
      { error: "Email, code, and new password are required" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Password policy mirrors register: min 8, max 128. The bcrypt cost is
  // 12 (matches /api/auth/register) so a reset costs the same as signup.
  if (newPassword.length < 8 || newPassword.length > 128) {
    return NextResponse.json(
      { error: "Password must be 8-128 characters" },
      { status: 400 },
    );
  }

  const valid = await verifyOtp(email, code, "password_reset");
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true, emailVerifiedAt: true },
  });

  if (!dbUser) {
    // Belt-and-suspenders: verifyOtp only returns true if there was an
    // OTP issued for this email, and forgot-password only issues codes
    // for existing accounts. If we got here without a user row, it's a
    // pathological state — surface a generic error and stop.
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();

  await db
    .update(user)
    .set({
      passwordHash,
      // Reset proves the user controls the inbox, so mark verified if not
      // already. Pending-verify accounts can recover this way too.
      emailVerifiedAt: dbUser.emailVerifiedAt ?? now,
      updatedAt: now,
    })
    .where(eq(user.id, dbUser.id));

  return NextResponse.json({ success: true });
}
