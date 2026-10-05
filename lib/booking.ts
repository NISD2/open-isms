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

/**
 * The same booking page in cal.com's embed mode, for a plain iframe: no cal.com script on our
 * origin, so the colours are cal.com's own light theme rather than ours.
 */
export function bookerFrameUrl(
  search: string,
  calLink: string = BOOKING_CAL_LINK,
): string {
  const params = new URLSearchParams({
    embed: "true",
    theme: "light",
    layout: "month_view",
  });
  for (const [key, value] of campaignTags(search)) params.set(key, value);
  return `https://cal.com/${calLink}?${params.toString()}`;
}
