/**
 * The grandfathering promo link: a public code (`?promo=2400`) that gives whoever
 * signs in or signs up with it what people had who were here before the paywall,
 * the free journey and 2.400 a year for the Durchgang, renewals included.
 *
 * Any page opened with the code remembers it in a cookie (proxy.ts), so it
 * survives the trip through Google or the email code; the next sign-in applies it
 * (lib/auth/config.ts, ./promo-grant).
 *
 * The code is public on purpose, so it can be forwarded, which means anyone who
 * has it gets the price for good. So it only ever runs with a last day:
 * GRANDFATHER_PROMO_CODE without GRANDFATHER_PROMO_UNTIL does nothing. After the
 * last day the link still opens, and the sign-in pages say the offer has ended.
 * Pure, so the edge proxy can import it.
 */
export const PROMO_COOKIE = "nisd2_promo";
export const PROMO_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;

/** A last day long past: what an unreadable GRANDFATHER_PROMO_UNTIL becomes, so the promo is closed. */
export const PROMO_ENDED = "0001-01-01";

export type PromoSettings = {
  readonly GRANDFATHER_PROMO_CODE?: string;
  /** Last day the code works, YYYY-MM-DD, a calendar day in Berlin. Required. */
  readonly GRANDFATHER_PROMO_UNTIL?: string;
};

export type PromoState =
  | { readonly state: "active"; readonly until: string }
  | { readonly state: "expired"; readonly until: string }
  | { readonly state: "none" };

const berlinDay = (date: Date): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(date);

/**
 * What this candidate code means today (Berlin): the configured code within its
 * last day, the configured code after it, or nothing (another string, no code
 * configured, or no last day configured). Exact match, no normalising.
 */
export const promoState = (
  candidate: string | null | undefined,
  settings: PromoSettings,
  now: Date = new Date(),
): PromoState => {
  const code = settings.GRANDFATHER_PROMO_CODE;
  const until = settings.GRANDFATHER_PROMO_UNTIL;
  if (!code || !until || candidate !== code) return { state: "none" };
  return berlinDay(now) <= until
    ? { state: "active", until }
    : { state: "expired", until };
};

/** What the platform admin's Pricing tab shows about the promo. */
export type PromoSummary =
  | { readonly configured: false; readonly missing: "code" | "last day" }
  | {
      readonly configured: true;
      readonly code: string;
      readonly until: string;
      readonly state: "active" | "expired";
      /** Calendar days from today (Berlin) to the last day; 0 on the last day, negative after. */
      readonly daysLeft: number;
    };

const dayNumber = (isoDay: string) => Date.parse(`${isoDay}T00:00:00Z`) / 86_400_000;

export const promoSummary = (
  settings: PromoSettings,
  now: Date = new Date(),
): PromoSummary => {
  const code = settings.GRANDFATHER_PROMO_CODE;
  const until = settings.GRANDFATHER_PROMO_UNTIL;
  if (!code) return { configured: false, missing: "code" };
  if (!until) return { configured: false, missing: "last day" };
  const state = promoState(code, settings, now).state === "active" ? "active" : "expired";
  return {
    configured: true,
    code,
    until,
    state,
    daysLeft: dayNumber(until) - dayNumber(berlinDay(now)),
  };
};

export const isActivePromo = (
  candidate: string | null | undefined,
  settings: PromoSettings,
  now: Date = new Date(),
): candidate is string => promoState(candidate, settings, now).state === "active";
