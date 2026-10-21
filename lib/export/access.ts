import "@/lib/server-guard";

import { logAudit } from "@/lib/audit";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { billingVerdict, refusalResponse } from "@/lib/billing/act-gate";
import { db } from "@/lib/db";
import { MANAGEMENT_ROLE } from "@/lib/durchgang";
import { rateLimit } from "@/lib/rate-limit";

export type ExportAccess =
  | { readonly ok: true; readonly companyId: string; readonly userId: string }
  | { readonly ok: false; readonly response: Response };

/**
 * Who may export the company's records: whoever may read its audit trail, and management, who
 * approved what the files hold and passes them on.
 */
export const mayExport = (session: {
  readonly role: string;
  readonly jobTitle?: string | null;
}): boolean => hasReviewAccess(session.role) || session.jobTitle === MANAGEMENT_ROLE;

/**
 * Who may download an export (`mayExport`), a few times a minute per person and kind. Not behind
 * the paywall: a company's own records always leave with it (AGB B10). Inside an order's money back
 * the first export ends it (`billingVerdict`, AGB B7), so the page asks first and records the yes,
 * and a download that arrives unconfirmed is held back. A download let through is logged
 * (`logTakenOut`).
 */
export async function exportAccess(
  kind: string,
  perMinute: number,
): Promise<ExportAccess> {
  const session = await getSession();
  if (!session?.companyId) {
    return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  }
  if (!mayExport(session)) {
    return { ok: false, response: new Response("Forbidden", { status: 403 }) };
  }
  // The limit first: the billing state may ask Qonto, and a refused download in a loop must not
  // reach it more than a few times a minute.
  if (!(await rateLimit(`export:${kind}:${session.user.id}`, perMinute, 60_000))) {
    return { ok: false, response: new Response("Too many requests", { status: 429 }) };
  }
  const verdict = await billingVerdict(db, session, "export");
  if (verdict.kind !== "allow") return { ok: false, response: refusalResponse(verdict) };
  await logTakenOut(session.companyId, session.user.id, kind);
  return { ok: true, companyId: session.companyId, userId: session.user.id };
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * The company's records left the app: one row per person and kind of file an hour, as an
 * assistant's read leaves one (lib/mcp/events.ts), so a person clicking through the files does
 * not push sign-offs off the audit page (the last 100 rows).
 */
async function logTakenOut(companyId: string, userId: string, kind: string) {
  if (!(await rateLimit(`export-log:${kind}:${userId}`, 1, HOUR_MS))) return;
  await logAudit({
    companyId,
    userId,
    action: "export.downloaded",
    entityType: "export",
    entityId: null,
    description: kind,
    newValue: { kind },
  });
}

/** The download headers for a file named after what it holds and today's date. */
export const attachment = (type: string, name: string, extension: string) => ({
  "Content-Type": type,
  "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.${extension}"`,
});
