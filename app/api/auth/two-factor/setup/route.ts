import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPassword } from "@/lib/auth/password-check";
import { twoFactorKey } from "@/lib/auth/two-factor/crypto";
import { twoFactorRequirement } from "@/lib/auth/two-factor/policy";
import { readTwoFactor, startSetup } from "@/lib/auth/two-factor/store";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";

const Body = z.object({ email: z.string().max(255), password: z.string().max(128) });

/**
 * Setting up the authenticator app during a sign-in, for someone who must have it (platform admin,
 * or a company that requires it) and has not set it up yet. There is no session yet, so the
 * password comes along, checked as the sign-in checks it and against the same login budget.
 *
 * POST /api/auth/two-factor/setup
 *   body: { email, password }
 *   200:  { secret, uri, qrDataUrl, recoveryCodes } — shown once, the pending setup
 *   401:  wrong password, unverified address, or nothing to set up (one answer for all three)
 *   429:  too many sign-in attempts
 *
 * The code from the app then goes with the password to the sign-in itself, which confirms the
 * setup and signs the person in (lib/auth/two-factor/sign-in.ts).
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const refused = NextResponse.json({ error: "Not available" }, { status: 401 });

  const checked = await checkPassword(
    db,
    parsed.data.email,
    parsed.data.password,
    getClientIp(request.headers),
  );
  if (!checked.ok) {
    return checked.reason === "rate_limited"
      ? NextResponse.json({ error: "Too many attempts" }, { status: 429 })
      : refused;
  }

  const key = twoFactorKey();
  const person = { userId: checked.user.id, email: checked.user.email };
  const [row, requiredBy] = await Promise.all([
    readTwoFactor(db, person.userId),
    twoFactorRequirement(db, person),
  ]);
  // Only for the setup the sign-in asks for: never over an app already set up.
  if (row?.enabledAt || requiredBy === null) return refused;

  const material = await startSetup(db, key, person, new Date());
  return NextResponse.json(material, { headers: { "Cache-Control": "no-store" } });
}
