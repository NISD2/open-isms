import "@/lib/server-guard";

import { getSession, hasReviewAccess } from "@/lib/auth";
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
 * the paywall: a company's own records always leave with it.
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
  if (!(await rateLimit(`export:${kind}:${session.user.id}`, perMinute, 60_000))) {
    return { ok: false, response: new Response("Too many requests", { status: 429 }) };
  }
  return { ok: true, companyId: session.companyId, userId: session.user.id };
}

/** The download headers for a file named after what it holds and today's date. */
export const attachment = (type: string, name: string, extension: string) => ({
  "Content-Type": type,
  "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.${extension}"`,
});
