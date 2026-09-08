/**
 * Unsubscribe-token signing for soft-touch follow-up emails.
 *
 * The token is HMAC-SHA256(AUTH_SECRET, userId) truncated to 32 hex chars.
 * AUTH_SECRET is reused because it is always present, required to be ≥32
 * chars (per lib/env.ts), and is rotated together with the rest of the
 * auth surface. Splitting into a dedicated UNSUBSCRIBE_SECRET is a clean
 * follow-up if the surface grows or rotation cadences need to differ.
 *
 * Tokens are deterministic per userId — clicking the same unsubscribe link
 * twice flips the same flag, no replay risk. Verification uses
 * `crypto.timingSafeEqual` to defeat timing oracles.
 */
import "@/lib/server-guard";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/utils";

const TOKEN_LENGTH = 32;

function signUserId(userId: string): string {
  return createHmac("sha256", env.AUTH_SECRET)
    .update(userId)
    .digest("hex")
    .slice(0, TOKEN_LENGTH);
}

export function unsubscribeToken(userId: string): string {
  return signUserId(userId);
}

export function unsubscribeUrl(userId: string): string {
  const token = unsubscribeToken(userId);
  return `${getAppUrl()}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${token}`;
}

/**
 * One-click opt-out from ONE kind of message — what the RFC 8058 header and
 * the footer link point at. Scoping it to the message's own type is the least
 * surprising behaviour: a person switching off nudges keeps their deadline
 * reminders. Broader choices live in the preference centre.
 *
 * The token still signs only the user id, so links in already-delivered mail
 * (which carry no scope) keep working and mean "all optional mail off". The
 * scope is not a capability: the worst a holder of their own valid token can
 * do by editing it is unsubscribe themselves from something else, which the
 * same link already permits.
 */
export function oneClickUnsubscribeUrl(userId: string, emailTypeId: string): string {
  const token = unsubscribeToken(userId);
  return `${getAppUrl()}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${token}&scope=${encodeURIComponent(`type:${emailTypeId}`)}`;
}

/**
 * The preference centre, reachable from any optional email without signing
 * in. Same signed-token credential as the unsubscribe link.
 */
export function preferenceCentreUrl(userId: string, locale?: string): string {
  const token = unsubscribeToken(userId);
  const lang = locale ? `&lang=${encodeURIComponent(locale)}` : "";
  return `${getAppUrl()}/email/preferences?u=${encodeURIComponent(userId)}&t=${token}${lang}`;
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (token.length !== TOKEN_LENGTH) return false;
  const expected = Buffer.from(signUserId(userId), "utf8");
  const actual = Buffer.from(token, "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
