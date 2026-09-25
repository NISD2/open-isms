import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { consumeSetupToken, readSetupToken } from "@/lib/auth/setup-link";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { user } from "@/schema";

/**
 * Set the first password of an account a platform admin created (door two), from the setup link.
 *
 * The link token is the proof of the inbox, like the code in a password reset, so on success the
 * email is marked verified and every earlier session is revoked. The token is used up in the same
 * request, so the link works once.
 *
 * POST /api/auth/setup-password
 *   body: { token: string, newPassword: string }
 *   200:  { success: true, email }
 *   400:  { error }    429: { error }
 */
export async function POST(request: Request) {
  if (!rateLimit(`setup-password:${getClientIp(request.headers)}`, 10, 15 * 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const token =
    typeof body === "object" && body && "token" in body ? body.token : undefined;
  const newPassword =
    typeof body === "object" && body && "newPassword" in body
      ? body.newPassword
      : undefined;
  if (typeof token !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // The same policy as register and reset.
  if (newPassword.length < 8 || newPassword.length > 128) {
    return NextResponse.json(
      { error: "Password must be 8-128 characters" },
      { status: 400 },
    );
  }

  const link = await readSetupToken(db, token);
  if (!link) {
    return NextResponse.json(
      { error: "This link is invalid or has expired" },
      { status: 400 },
    );
  }
  const account = await db.query.user.findFirst({
    where: eq(user.email, link.email),
    columns: { id: true, emailVerifiedAt: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Hashed before the token is spent, so a failure here leaves the link usable.
  const passwordHash = await bcrypt.hash(newPassword, 12);
  if (!(await consumeSetupToken(db, link.id))) {
    return NextResponse.json(
      { error: "This link has already been used" },
      { status: 400 },
    );
  }
  const now = new Date();
  await db
    .update(user)
    .set({
      passwordHash,
      emailVerifiedAt: account.emailVerifiedAt ?? now,
      sessionVersion: sql`${user.sessionVersion} + 1`,
      updatedAt: now,
    })
    .where(eq(user.id, account.id));

  return NextResponse.json({ success: true, email: link.email });
}
