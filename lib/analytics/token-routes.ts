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
 * Umami's `data-before-send` hook, called with every event before it leaves the browser; a
 * falsy return drops it. Needed on top of not loading the script on these pages, because once
 * loaded the tracker follows client-side navigation: sign-in pushes straight on to
 * /invite/<token>, and the page after it would carry that URL as its referrer.
 */
export function analyticsBeforeSend(_type: string, payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null) return null;
  const url = "url" in payload ? payload.url : undefined;
  if (typeof url !== "string" || onTokenRoute(url)) return null;
  const referrer = "referrer" in payload ? payload.referrer : undefined;
  return typeof referrer === "string" && referrer !== "" && onTokenRoute(referrer)
    ? { ...payload, referrer: "" }
    : payload;
}
