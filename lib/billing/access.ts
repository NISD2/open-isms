/**
 * What an account may use right now, and what a new account starts at.
 *
 * The paywall goes live when a platform admin launches pricing in the platform admin Pricing tab,
 * once, not when a release deploys (NIS2 plan, slice 5). Until then nobody is gated, whatever is
 * stored, and every new account is grandfathered, because everyone who gets in before the paywall
 * keeps the current journey free.
 */
import { ORDER_SLUGS } from "@/i18n/slugs";
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

/** What decides whether a person is grandfathered: the launch stamp, and the got-in signal. */
export interface GrandfatherFacts {
  readonly grandfatheredAt: Date | null;
  readonly emailVerifiedAt: Date | null;
  readonly loginCount: number;
  readonly lastLoginAt: Date | null;
}

/**
 * Whether this person is grandfathered. After the launch, exactly the people it stamped. Before it,
 * everyone who has got in, because the launch will stamp exactly them.
 */
export const isGrandfatheredPerson = (
  person: GrandfatherFacts,
  launched: boolean,
): boolean => person.grandfatheredAt !== null || (!launched && hasGotIn(person));

/**
 * The level an account falls back to when it stops being paid for (a cancel inside the thirty
 * days, or a revoke): grandfathered when its holder is a grandfathered person, otherwise free. The
 * level before the order is not recorded anywhere, so the holder decides, the same person-based
 * rule `newAccountAccessLevel` applies to a new account.
 */
export const unpaidAccessLevel = (holderGrandfathered: boolean): AccessLevel =>
  holderGrandfathered ? "grandfathered" : "free";

/** Where an account that must order first is sent from any portal page it may not open. */
export const OFFER_PATH = "/billing/offer";

/**
 * What the walk's locked home offers an account that may not walk. A free account orders from the
 * offer, which opens the Compliance Portal and shows the two portals that need no order; a free
 * account exists only once pricing is launched, so the offer is always there for it. Any other
 * (grandfathered, or no level yet) has the journey open, as the portal gate has it: it goes
 * straight to the order page with its own price and is offered its journey beside it. While
 * ordering is not open to it (`billingFor`: before the launch, or without live keys) the order
 * page does not exist, so only the journey is offered.
 */
export type WalkLock =
  | { readonly orderAt: typeof OFFER_PATH; readonly journey: false }
  | { readonly orderAt: "/bestellen"; readonly journey: true }
  | { readonly orderAt: null; readonly journey: true };

export const walkLockFor = (
  level: AccessLevel | null,
  orderingOpen: boolean,
): WalkLock =>
  level === "free"
    ? { orderAt: OFFER_PATH, journey: false }
    : { orderAt: orderingOpen ? "/bestellen" : null, journey: true };

/**
 * The order page as the portal layout sees it. It is the one portal page with a translated slug,
 * and the layout reads the path as the visitor typed it, so every locale's slug is listed.
 */
export const ORDER_PATHS: readonly string[] = [...new Set(Object.values(ORDER_SLUGS))];

/**
 * The pages a free account opens with example rows in place of its own (Simon, 04.10.2026: "A
 * free user should be able to see these pages but not actually use them"). Each page shows the
 * examples itself, before it reads anything behind the paywall.
 */
export const EXAMPLE_PORTAL_PATHS: readonly string[] = [
  "/assets",
  "/suppliers",
  "/risks",
  "/policies",
  "/training",
  "/management-reviews",
  "/audit",
];

/**
 * The portal pages an account without a paid or grandfathered level still reaches, the offer at
 * /billing/offer among them. Everything else in the portal sends it to the offer. The course and
 * the supplier portal live outside the portal and stay open. /export because a company's own
 * records always leave with it, as its downloads do (lib/export/access.ts). The registers and the
 * activity log open with example rows (`EXAMPLE_PORTAL_PATHS`).
 */
export const FREE_PORTAL_PATHS: readonly string[] = [
  "/billing",
  "/settings",
  "/organization",
  "/notifications",
  "/export",
  ...EXAMPLE_PORTAL_PATHS,
  ...ORDER_PATHS,
];

/** Whether an effective level may open this portal path. */
export const mayOpenPortalPath = (level: AccessLevel, pathname: string): boolean =>
  level !== "free" ||
  FREE_PORTAL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Whether a person may walk the Durchgang, the paid guided path. Only a paid account: a
 * grandfathered one keeps the current journey free and pays for the guided path, and before the
 * launch every account reads as grandfathered, so "not free" opened it to everyone. A platform
 * admin passes too, so it can be shown on a call from the operator's own company.
 */
export const mayWalkDurchgang = (
  level: AccessLevel | null,
  platformAdmin: boolean,
): boolean => level === "full" || platformAdmin;
