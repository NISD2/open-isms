/**
 * The longest a sign-in lasts, however busy the session is.
 *
 * Auth.js re-signs the session JWT with a fresh expiry on every read of /api/auth/session, so its
 * maxAge is an idle timeout only: a copied cookie that something keeps polling never expires. The
 * sign-in time is stamped into the token once, when the session is established (the `jwt` callback
 * in lib/auth/config.ts), and the same callback ends the token once it is too old or revoked.
 */
export const SESSION_ABSOLUTE_MAX_AGE_S = 12 * 60 * 60;

/**
 * True while a token's revocation counter still matches the account's (audit M-1). A password
 * reset, a removed password or a sign-out raises the stored one, which ends every token stamped
 * before it. A token with no counter predates M-1 and counts as revoked (audit L-2).
 */
export function isSessionVersionCurrent(
  tokenVersion: number | null,
  storedVersion: number,
): boolean {
  return tokenVersion !== null && tokenVersion >= storedVersion;
}

/**
 * True while a token stamped at `authTime` (epoch seconds) is younger than the absolute limit. A
 * token with no stamp predates the rule and counts as expired, the same way a token with no
 * sessionVersion does: one extra sign-in for people mid-session when this ships.
 */
export function isWithinAbsoluteSessionAge(
  authTime: number | null,
  nowS: number,
): boolean {
  return authTime !== null && nowS - authTime < SESSION_ABSOLUTE_MAX_AGE_S;
}

/**
 * True when the token was issued to this account. Sessions are found by email and a new account's
 * revocation counter starts at 1, so without this a cookie from an erased account would open a new
 * one registered under the same address. Compared by id, not by time: user.created_at is stored
 * without a time zone in the database's clock, the sign-in time is the app's. A token from before
 * the id was stamped carries none and ages out within the absolute limit.
 */
export function issuedToAccount(
  tokenAccountId: string | null,
  accountId: string,
): boolean {
  return tokenAccountId === null || tokenAccountId === accountId;
}

/**
 * How recent a sign-in must be for an act that cannot be undone, such as deleting the account: an
 * unattended or copied session is older than this, the person at the keyboard just signed in.
 */
export const RECENT_SIGN_IN_S = 15 * 60;

export function isRecentSignIn(authTime: number | null, nowS: number): boolean {
  return authTime !== null && nowS - authTime < RECENT_SIGN_IN_S;
}

export function epochSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
