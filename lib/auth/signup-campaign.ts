import { z } from "zod";
import {
  FROM_PATH_KEY,
  GATE_PATH_KEY,
  gateDoor,
  originPath,
} from "@/lib/analytics/token-routes";
import { SIGNUP_CAMPAIGN_KEYS, type SignupCampaign } from "@/schema";

/** Long enough for any real tag value; anything longer is dropped rather than cut. */
const MAX_TAG_LENGTH = 100;
/** Five tags at the cap, URL-encoded, with room to spare. A longer body is not a campaign. */
const MAX_QUERY_LENGTH = 2000;

const tagValue = z.string().trim().min(1).max(MAX_TAG_LENGTH);

const campaignValue = (
  key: (typeof SIGNUP_CAMPAIGN_KEYS)[number],
  raw: string | null,
) => {
  if (key === FROM_PATH_KEY) return originPath(raw);
  if (key === GATE_PATH_KEY) return gateDoor(raw);
  const value = tagValue.safeParse(raw);
  return value.success ? value.data : null;
};

/**
 * The source a signup request carried, as a query string from the sign-in page's own URL.
 * Untrusted: only the five utm_* keys, from_path and gate_path survive, each a non-blank string
 * within the cap. from_path is the page whose link was clicked (a plain local path, never a token
 * route); gate_path is the entry door the visitor was sent away from, e.g. the lesson behind
 * "Start the course" (an entry door only: lib/analytics/token-routes.ts). Every other key and
 * every invalid value is dropped. Null when nothing survives, which is what the column stores for
 * a signup without a source.
 */
export function signupCampaignFrom(query: unknown): SignupCampaign | null {
  if (typeof query !== "string" || query.length > MAX_QUERY_LENGTH) return null;
  const params = new URLSearchParams(query);
  const tags = SIGNUP_CAMPAIGN_KEYS.flatMap((key) => {
    const value = campaignValue(key, params.get(key));
    return value === null ? [] : [[key, value] as const];
  });
  return tags.length > 0 ? Object.fromEntries(tags) : null;
}

/** One line for the operator signup notice, e.g. "utm_source=google / utm_term=nis2", or null. */
export function describeSignupCampaign(campaign: SignupCampaign | null): string | null {
  const parts = SIGNUP_CAMPAIGN_KEYS.filter((key) => key !== GATE_PATH_KEY).flatMap(
    (key) => {
      const value = campaign?.[key];
      return value ? [`${key}=${value}`] : [];
    },
  );
  return parts.length > 0 ? parts.join(" / ") : null;
}

/** The entry door the signup was sent away from, for its own line in the notice, or null. */
export function describeSignupGate(campaign: SignupCampaign | null): string | null {
  return campaign?.gate_path ?? null;
}
