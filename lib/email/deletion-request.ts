/**
 * Signed deletion-request links.
 *
 * Mirrors lib/email/unsubscribe.ts exactly: HMAC-SHA256(AUTH_SECRET, message)
 * truncated to 32 hex chars, verified with crypto.timingSafeEqual. AUTH_SECRET
 * is reused (always present, required ≥32 chars per lib/env.ts) — no new secret.
 *
 * The signed message is namespaced with a "data-deletion:" prefix so a token
 * minted here is NOT interchangeable with an unsubscribe token for the same
 * user. Tokens are deterministic per userId (clicking the same link twice is
 * idempotent — the request page just re-shows the form; the actual insert is a
 * separate submit).
 *
 * The COO drops one of these links into a personal follow-up email; clicking it
 * lets the person confirm a deletion request without logging back in.
 */
import "@/lib/server-guard";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/utils";

const TOKEN_LENGTH = 32;
const PURPOSE = "data-deletion:";

function signUserId(userId: string): string {
  return createHmac("sha256", env.AUTH_SECRET)
    .update(PURPOSE + userId)
    .digest("hex")
    .slice(0, TOKEN_LENGTH);
}

export function deletionRequestToken(userId: string): string {
  return signUserId(userId);
}

/**
 * Full signed link for a given user. Resolves to the localized /loeschung
 * (DE) / /data-deletion (EN) page, which reads `u` + `t` and prefills the
 * verified form. Emit the DE canonical path; next-intl serves the locale slug.
 */
export function deletionRequestUrl(userId: string): string {
  const token = deletionRequestToken(userId);
  return `${getAppUrl()}/loeschung?u=${encodeURIComponent(userId)}&t=${token}`;
}

export function verifyDeletionRequestToken(userId: string, token: string): boolean {
  if (token.length !== TOKEN_LENGTH) return false;
  const expected = Buffer.from(signUserId(userId), "utf8");
  const actual = Buffer.from(token, "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
