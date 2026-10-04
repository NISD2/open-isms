import { isCampaignTag } from "@/lib/analytics/token-routes";

export const BOOKING_URL = "https://cal.com/nisd2";

/**
 * The booking page with the visitor's campaign tags handed on, so cal.com can record which
 * campaign a booking came from (hidden booking questions named after each utm_* key). Only campaign tags
 * pass: a query string can carry a credential, the same rule the analytics hook follows.
 */
export function bookingUrlFor(search: string): string {
  const tags = [...new URLSearchParams(search)].filter(([key]) => isCampaignTag(key));
  return tags.length > 0
    ? `${BOOKING_URL}?${new URLSearchParams(tags).toString()}`
    : BOOKING_URL;
}
