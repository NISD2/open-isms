import { MIMEType } from "node:util";

export type TransportVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: 403 | 415; readonly message: string };

const READ_METHODS = new Set(["GET", "HEAD"]);

function isJson(contentType: string | null): boolean {
  if (!contentType) return false;
  try {
    return new MIMEType(contentType).essence === "application/json";
  } catch {
    return false;
  }
}

/**
 * Whether a request to /api/trpc may reach a procedure at all.
 *
 * A browser posts a form (multipart, urlencoded, plain text) to another site without asking first,
 * and tRPC accepts multipart/form-data as a mutation. A mutation that takes no input never looks
 * at the body, so any page on the web could post to billing.cancel with the visitor's cookie, with
 * only SameSite=Lax in the way. Every client of this endpoint sends JSON, which a page on another
 * site cannot send without a CORS preflight this app never answers. Sec-Fetch-Site is the browser
 * stating outright that the request came from another site.
 *
 * Reads stay open: tRPC runs no mutation over GET.
 */
export function checkTransport(method: string, headers: Headers): TransportVerdict {
  if (READ_METHODS.has(method)) return { ok: true };
  if (headers.get("sec-fetch-site") === "cross-site") {
    return { ok: false, status: 403, message: "Cross-site requests are not accepted." };
  }
  if (!isJson(headers.get("content-type"))) {
    return { ok: false, status: 415, message: "Only application/json is accepted." };
  }
  return { ok: true };
}
