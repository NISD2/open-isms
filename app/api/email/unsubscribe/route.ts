/**
 * GET  /api/email/unsubscribe?u={userId}&t={token}  — human clicks the link
 * POST /api/email/unsubscribe?u={userId}&t={token}  — RFC 8058 one-click
 *
 * Sets user.emailFollowupsDisabled=true for the given user. GET redirects a
 * human to the confirmation page; POST is what Gmail/Yahoo send when the
 * user taps the native Unsubscribe button (sendMail advertises
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, so this handler is
 * the other half of that promise — without it the mail client gets a 405,
 * shows the user as unsubscribed, and the mail keeps coming until they hit
 * "Report spam"). Token is HMAC-signed (see lib/email/unsubscribe.ts).
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

/**
 * Verify the token and flip the flag. Returns false for any invalid input
 * (missing params, bad token, unknown user). Idempotent — a second call for
 * an already-unsubscribed user succeeds without a second audit row.
 */
async function processUnsubscribe(req: NextRequest): Promise<boolean> {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u");
  const token = url.searchParams.get("t");

  if (!userId || !token) return false;
  if (!verifyUnsubscribeToken(userId, token)) return false;

  // Look up the user to confirm existence and capture their companyId for
  // the audit row. The flag flip is idempotent — clicking twice is a no-op.
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, email: true, companyId: true, emailFollowupsDisabled: true },
  });
  if (!row) return false;

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
  return true;
}

export async function GET(req: NextRequest) {
  if (!(await processUnsubscribe(req))) {
    return invalidLinkRedirect();
  }
  return NextResponse.redirect(`${getAppUrl()}/email/unsubscribed`, { status: 303 });
}

/**
 * RFC 8058 one-click. The caller is a mail provider's robot, not a browser:
 * respond with plain statuses (200/400), never a redirect — some providers
 * treat anything but 2xx as a failed unsubscribe.
 */
export async function POST(req: NextRequest) {
  if (!(await processUnsubscribe(req))) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
