/**
 * GET /api/email/unsubscribe?u={userId}&t={token}
 *
 * Sets user.emailFollowupsDisabled=true for the given user and redirects
 * to the confirmation page. Token is HMAC-signed (see lib/email/unsubscribe.ts).
 *
 * No auth required — the signed token is the credential. Same threat model
 * as a one-click email unsubscribe link.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { logAudit } from "@/lib/audit";
import { getAppUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Friendly HTML page for the unhappy paths (missing params, bad token,
 * unknown user) instead of a raw JSON error. The link is single-credential
 * and unauthenticated, so the only states a human ever sees are "done" or
 * "this link is no longer valid" — both belong on a styled page.
 */
function invalidLinkRedirect() {
  return NextResponse.redirect(`${getAppUrl()}/email/unsubscribed?status=invalid`, {
    status: 303,
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u");
  const token = url.searchParams.get("t");

  if (!userId || !token) {
    return invalidLinkRedirect();
  }
  if (!verifyUnsubscribeToken(userId, token)) {
    return invalidLinkRedirect();
  }

  // Look up the user to confirm existence and capture their companyId for
  // the audit row. The flag flip is idempotent — clicking twice is a no-op.
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, email: true, companyId: true, emailFollowupsDisabled: true },
  });
  if (!row) {
    return invalidLinkRedirect();
  }

  if (!row.emailFollowupsDisabled) {
    await db
      .update(user)
      .set({ emailFollowupsDisabled: true, updatedAt: new Date() })
      .where(eq(user.id, userId));

    logAudit({
      companyId: row.companyId,
      userId: row.id,
      action: "email.unsubscribed",
      entityType: "user",
      entityId: row.id,
      description: `Unsubscribed ${row.email} from follow-up emails`,
    });
  }

  return NextResponse.redirect(`${getAppUrl()}/email/unsubscribed`, { status: 303 });
}
