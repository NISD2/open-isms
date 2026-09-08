/**
 * POST /api/email/preferences
 *
 * Toggle one email preference scope for one person. Credential is the same
 * HMAC-signed token the unsubscribe links carry, so the preference centre
 * works straight from an email without signing in — the person who received
 * the mail is by definition the person allowed to change its settings.
 *
 * Body: { u: userId, t: token, scope: string, subscribed: boolean }
 *   subscribed=false  -> store an opt-out row for that scope
 *   subscribed=true   -> remove it (and, for scope "all", clear the legacy
 *                        emailFollowupsDisabled boolean)
 *
 * Both directions are idempotent.
 */

import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { parseScope, SCOPE_ALL } from "@/lib/mail/consent";
import { emailPreference, user } from "@/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = typeof body.u === "string" ? body.u : null;
  const token = typeof body.t === "string" ? body.t : null;
  const subscribed = body.subscribed === true;
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 403 });
  }

  const scope = parseScope(typeof body.scope === "string" ? body.scope : null);
  if (!scope) {
    return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
  }

  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, email: true, companyId: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Invalid link" }, { status: 403 });
  }

  if (subscribed) {
    await db
      .delete(emailPreference)
      .where(and(eq(emailPreference.userId, row.id), eq(emailPreference.scope, scope)));
    // Turning anything back on also clears the coarse switch: leaving it set
    // would silently override the choice the person just made.
    if (scope === SCOPE_ALL) {
      await db
        .update(user)
        .set({ emailFollowupsDisabled: false, updatedAt: new Date() })
        .where(eq(user.id, row.id));
    }
  } else if (scope === SCOPE_ALL) {
    await db
      .update(user)
      .set({ emailFollowupsDisabled: true, updatedAt: new Date() })
      .where(eq(user.id, row.id));
  } else {
    await db
      .insert(emailPreference)
      .values({ userId: row.id, scope, source: "preference_centre" })
      .onConflictDoNothing();
  }

  logAudit({
    companyId: row.companyId,
    userId: row.id,
    action: subscribed ? "email.resubscribed_scope" : "email.unsubscribed_scope",
    entityType: "user",
    entityId: row.id,
    description: `${subscribed ? "Resubscribed" : "Unsubscribed"} ${row.email} ${subscribed ? "to" : "from"} ${scope} via preference centre`,
  });

  return NextResponse.json({ ok: true, scope, subscribed });
}
