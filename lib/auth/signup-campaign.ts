import { z } from "zod";
import { SIGNUP_CAMPAIGN_KEYS, type SignupCampaign } from "@/schema";

/** Long enough for any real tag value; anything longer is dropped rather than cut. */
const MAX_TAG_LENGTH = 100;
/** Five tags at the cap, URL-encoded, with room to spare. A longer body is not a campaign. */
const MAX_QUERY_LENGTH = 2000;

const tagValue = z.string().trim().min(1).max(MAX_TAG_LENGTH);

/**
 * The campaign tags a signup request carried, as a query string from the sign-in page's own URL.
 * Untrusted: only the five utm_* keys survive, each a non-blank string within the cap; every other
 * key and every invalid value is dropped. Null when nothing survives, which is what the column
 * stores for a signup without tags.
 */
export function signupCampaignFrom(query: unknown): SignupCampaign | null {
  if (typeof query !== "string" || query.length > MAX_QUERY_LENGTH) return null;
  const params = new URLSearchParams(query);
  const tags = SIGNUP_CAMPAIGN_KEYS.flatMap((key) => {
    const value = tagValue.safeParse(params.get(key));
    return value.success ? [[key, value.data] as const] : [];
  });
  return tags.length > 0 ? Object.fromEntries(tags) : null;
}

/** One line for the operator signup notice, e.g. "utm_source=google / utm_term=nis2", or null. */
export function describeSignupCampaign(campaign: SignupCampaign | null): string | null {
  const parts = SIGNUP_CAMPAIGN_KEYS.flatMap((key) => {
    const value = campaign?.[key];
    return value ? [`${key}=${value}`] : [];
  });
  return parts.length > 0 ? parts.join(" / ") : null;
}
