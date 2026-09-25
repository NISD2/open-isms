/**
 * What an account may use right now, and what a new account starts at.
 *
 * The paywall goes live when a platform admin launches pricing in the platform admin Pricing tab,
 * once, not when a release deploys (NIS2 plan, slice 5). Until then nobody is gated, whatever is
 * stored, and every new account is grandfathered, because everyone who gets in before the paywall
 * keeps the current journey free.
 */
import type { AccessLevel } from "./accounts";

/**
 * The level the gate enforces for one person in one company: the account's stored level, lifted to
 * grandfathered before the launch for everyone, and after it for a person stamped at the launch.
 * Grandfathering belongs to the person, so it holds in any company they open, including one they
 * joined after the launch whose account is free.
 */
export const effectiveAccessLevel = (
  stored: AccessLevel,
  launched: boolean,
  personGrandfathered: boolean,
): AccessLevel =>
  stored === "free" && (!launched || personGrandfathered) ? "grandfathered" : stored;

/**
 * The level a brand-new account is created with. Grandfathering belongs to the person: someone
 * stamped at the launch keeps the current journey free for any company they start later.
 */
export const newAccountAccessLevel = (
  launched: boolean,
  ownerGrandfathered: boolean,
): AccessLevel => (launched && !ownerGrandfathered ? "free" : "grandfathered");

/**
 * Whether a person has ever got in: a verified email, a login count, or a last login. The same
 * signal the 0016 backfill and the launch (./launch) use. login_count alone is not enough: it
 * arrived with migration 0007 at 0 for everyone and was never backfilled.
 */
export const hasGotIn = (person: {
  readonly emailVerifiedAt: Date | null;
  readonly loginCount: number;
  readonly lastLoginAt: Date | null;
}): boolean =>
  person.emailVerifiedAt !== null || person.loginCount > 0 || person.lastLoginAt !== null;

/**
 * The portal pages an account without a paid or grandfathered level still reaches. Everything else
 * in the portal sends it to /bestellen. The course and /bestellen live outside the portal.
 */
export const FREE_PORTAL_PATHS = [
  "/billing",
  "/settings",
  "/organization",
  "/notifications",
] as const;

/** Whether an effective level may open this portal path. */
export const mayOpenPortalPath = (level: AccessLevel, pathname: string): boolean =>
  level !== "free" ||
  FREE_PORTAL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
