/**
 * Consent for Google Ads measurement. Pure rules; the browser reads and writes live in
 * components/analytics/GoogleAdsTag.tsx.
 *
 * The site is cookieless for everyone else (Umami), so the question is only asked of a visitor who
 * arrives with a Google click ID in the address, the one identifier this measurement needs. A
 * visitor without one is never asked and nothing is stored for them.
 */

export const CONSENT_STORAGE_KEY = "nisd2-ads-consent";
/** The footer link and the banner talk through this event, so neither imports the other. */
export const OPEN_SETTINGS_EVENT = "nisd2:ads-consent-open";
/** Fired by a link that starts registration; the tag turns it into a conversion if consent is given. */
export const REGISTRATION_STARTED_EVENT = "nisd2:registration-started";

/** Google's three click ID parameters: web, app-to-web, web-to-app. */
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

export type Consent = "granted" | "denied";

export const parseConsent = (stored: string | null): Consent | null =>
  stored === "granted" || stored === "denied" ? stored : null;

export const hasAdClickId = (search: string): boolean => {
  const params = new URLSearchParams(search);
  return CLICK_ID_KEYS.some((key) => (params.get(key) ?? "") !== "");
};

/**
 * Whether the banner shows. Asked once per device: after an answer it only returns when the visitor
 * opens the settings from the footer, which can happen on any page.
 */
export const bannerVisible = (input: {
  readonly consent: Consent | null;
  readonly search: string;
  readonly reopened: boolean;
}): boolean => input.reopened || (input.consent === null && hasAdClickId(input.search));
