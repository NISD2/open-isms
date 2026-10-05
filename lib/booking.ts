import { campaignTags } from "@/lib/analytics/token-routes";

/** The cal.com event every "talk to us first" link books: the short call with Simon. */
export const BOOKING_CAL_LINK = "nisd2/qc";

export const BOOKING_URL = `https://cal.com/${BOOKING_CAL_LINK}`;

/**
 * The booking page with the visitor's campaign tags handed on, so cal.com can record which
 * campaign a booking came from (hidden booking questions named after each utm_* key). Only campaign tags
 * pass: a query string can carry a credential, the same rule the analytics hook follows.
 */
export function bookingUrlFor(
  search: string,
  calLink: string = BOOKING_CAL_LINK,
): string {
  const page = `https://cal.com/${calLink}`;
  const tags = campaignTags(search);
  return tags.size > 0 ? `${page}?${tags.toString()}` : page;
}
