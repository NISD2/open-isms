/**
 * What an account may use right now, and what a new account starts at.
 *
 * Pricing launched on nisd2.eu (NIS2 plan, slice 5): everyone who had got in by then was stamped
 * `grandfatheredAt` and keeps the journey free; everyone else orders.
 */
import { ORDER_SLUGS } from "@/i18n/slugs";
import type { AccessLevel } from "./accounts";

/**
 * The level the gate enforces for one person in one company: the account's stored level, lifted to
 * grandfathered for a person stamped at the launch. Grandfathering belongs to the person, so it
 * holds in any company they open, including one they joined after the launch whose account is free.
 */
export const effectiveAccessLevel = (
  stored: AccessLevel,
  personGrandfathered: boolean,
): AccessLevel => (stored === "free" && personGrandfathered ? "grandfathered" : stored);

/**
 * The level a brand-new account is created with: free, so its holder orders, where this deployment
 * sells (`sells`: live billing keys, lib/billing/ordering.ts). Where it does not, a self-hosted
 * instance or a local run, nobody could order, so a new account starts grandfathered. Someone
 * stamped at the launch keeps the journey free for any company they start later.
 */
export const newAccountAccessLevel = (
  sells: boolean,
  ownerGrandfathered: boolean,
): AccessLevel => (sells && !ownerGrandfathered ? "free" : "grandfathered");

/**
 * Whether a person has ever got in: a verified email, a login count, or a last login. The same
 * signal the 0016 backfill and the launch used. login_count alone is not enough: it arrived with
 * migration 0007 at 0 for everyone and was never backfilled.
 */
export const hasGotIn = (person: {
  readonly emailVerifiedAt: Date | null;
  readonly loginCount: number;
  readonly lastLoginAt: Date | null;
}): boolean =>
  person.emailVerifiedAt !== null || person.loginCount > 0 || person.lastLoginAt !== null;

/** Whether this person is grandfathered: exactly the people the launch (or a promo link) stamped. */
export const isGrandfatheredPerson = (person: {
  readonly grandfatheredAt: Date | null;
}): boolean => person.grandfatheredAt !== null;

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
 * offer, which opens the Compliance Portal and shows the two portals that need no order. Any other
 * (grandfathered, or no level yet) has the journey open, as the portal gate has it: it goes
 * straight to the order page with its own price and is offered its journey beside it. While
 * ordering is not open to it (`billingFor`: no live keys, as on a self-hosted instance) the order
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
 * grandfathered one keeps the current journey free and pays for the guided path, and where the
 * deployment sells nothing every new account is grandfathered, so "not free" would open it to
 * everyone. A platform admin passes too, so it can be shown on a call from the operator's own
 * company.
 */
export const mayWalkDurchgang = (
  level: AccessLevel | null,
  platformAdmin: boolean,
): boolean => level === "full" || platformAdmin;
