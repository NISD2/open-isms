/**
 * The longest a sign-in lasts, however busy the session is.
 *
 * Auth.js re-signs the session JWT with a fresh expiry on every read of /api/auth/session, so its
 * maxAge is an idle timeout only: a copied cookie that something keeps polling never expires. The
 * sign-in time is stamped into the token once, when the session is established (the `jwt` callback
 * in lib/auth/config.ts), and getSession measures from it.
 */
export const SESSION_ABSOLUTE_MAX_AGE_S = 12 * 60 * 60;

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

export function epochSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
