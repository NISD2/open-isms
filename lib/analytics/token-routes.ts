import { isLocaleCode } from "@/lib/locale";

/**
 * Pages whose URL is the credential: whoever holds the link is let in, so the URL must not
 * reach a third-party script or its logs. Password reset is not here because it sends a code,
 * not a link.
 */
export const TOKEN_ROUTE_PREFIXES = [
  // ?token= is a new customer's first-password link, valid for seven days.
  "/auth/setup",
  "/invite",
  // No expiry: the token works until the relationship is revoked.
  "/supplier-access",
  "/supplier-invite",
  "/gap-assessment/share",
] as const;

const PREFIX_SEGMENTS = TOKEN_ROUTE_PREFIXES.map((prefix) =>
  prefix.split("/").filter(Boolean),
);

/** With or without a locale segment in front, because only the default locale drops it. */
export function isTokenRoute(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const path = isLocaleCode(segments[0]?.toLowerCase()) ? segments.slice(1) : segments;
  return PREFIX_SEGMENTS.some((prefix) =>
    prefix.every((segment, i) => path[i] === segment),
  );
}

const BASE = "http://local.invalid";

/** Fails closed: a URL that does not parse is treated as one that carries a token. */
function onTokenRoute(href: string): boolean {
  try {
    return isTokenRoute(new URL(href, BASE).pathname);
  } catch {
    return true;
  }
}

/**
 * The URL with only the query parameters `keep` accepts, in the form it came in (relative or
 * absolute). A query string can carry a credential, e.g. sign-in's ?callbackUrl=/invite/<token>.
 */
function withQueryFiltered(href: string, keep: (key: string) => boolean): string {
  const parsed = new URL(href, BASE);
  const kept = [...parsed.searchParams].filter(([key]) => keep(key));
  const search = kept.length > 0 ? `?${new URLSearchParams(kept).toString()}` : "";
  const path = `${parsed.pathname}${search}`;
  return parsed.origin === new URL(BASE).origin ? path : `${parsed.origin}${path}`;
}

const isCampaignTag = (key: string) => key.startsWith("utm_");

/**
 * Umami's `data-before-send` hook, called with every event before it leaves the browser; a
 * falsy return drops it. Needed on top of not loading the script on these pages, because once
 * loaded the tracker follows client-side navigation: sign-in pushes straight on to
 * /invite/<token>, and the page after it would carry that URL as its referrer. Of the query
 * string only campaign tags survive, so the digest mails' utm_* links stay measurable.
 */
export function analyticsBeforeSend(_type: string, payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null) return null;
  const url = "url" in payload ? payload.url : undefined;
  if (typeof url !== "string" || onTokenRoute(url)) return null;
  const referrer = "referrer" in payload ? payload.referrer : undefined;
  const cleanReferrer =
    typeof referrer === "string" && referrer !== ""
      ? {
          referrer: onTokenRoute(referrer)
            ? ""
            : withQueryFiltered(referrer, () => false),
        }
      : {};
  return { ...payload, url: withQueryFiltered(url, isCampaignTag), ...cleanReferrer };
}
