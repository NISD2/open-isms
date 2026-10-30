import { ORDER_SLUGS } from "@/i18n/slugs";
import { localCallbackPath } from "@/lib/auth/local-path";
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
  // The token in the link is the only credential for accepting a partner agreement.
  "/partner-agreement",
  // A signed consent request for connecting an assistant, valid ten minutes (lib/mcp/oauth.ts).
  // It was missing until 21.10.2026, so Umami stored those URLs in full.
  "/mcp/verbinden",
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

export const isCampaignTag = (key: string) => key.startsWith("utm_");

/** The campaign tags of a query string, nothing else: the rest of a query can carry a credential. */
export function campaignTags(search: string): URLSearchParams {
  return new URLSearchParams(
    [...new URLSearchParams(search)].filter(([key]) => isCampaignTag(key)),
  );
}

/** Same key as in SIGNUP_CAMPAIGN_KEYS (schema), which the client bundle cannot import. */
export const FROM_PATH_KEY = "from_path";
const MAX_ORIGIN_PATH_LENGTH = 100;

/**
 * A page path a signup may record as the page that led to it, or null. Only a plain local path in
 * its canonical form qualifies (no host, query, fragment or odd escapes), and never a token route,
 * whose path is a credential. Untrusted input on the server, so it fails closed.
 */
export function originPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  if (value.length > MAX_ORIGIN_PATH_LENGTH) return null;
  try {
    const parsed = new URL(value, BASE);
    const plain = parsed.origin === new URL(BASE).origin && parsed.pathname === value;
    return plain && !isTokenRoute(value) ? value : null;
  } catch {
    return null;
  }
}

/** Same key as in SIGNUP_CAMPAIGN_KEYS (schema). Where the proxy leaves the page a visitor was after. */
export const CALLBACK_URL_KEY = "callbackUrl";
export const GATE_PATH_KEY = "gate_path";

/**
 * The entry doors a visitor meets before they have an account: a lesson, the walk, the journey and
 * the order page (one slug per language). A gated path outside these is recorded as nothing, since
 * the rest of the app carries ids of a tenant's own objects, e.g. /suppliers/<uuid>.
 */
const GATE_DOORS: ReadonlySet<string> = new Set([
  "training",
  "journey",
  "walkthrough",
  "durchgang",
  ...Object.values(ORDER_SLUGS).map((slug) => slug.slice(1)),
]);

const firstSegment = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  return (isLocaleCode(segments[0]?.toLowerCase()) ? segments[1] : segments[0]) ?? "";
};

/**
 * A path a signup may record as the entry door it was sent away from: a plain local path
 * (`originPath`) whose first segment is a door. What the server accepts for `gate_path`.
 */
export function gateDoor(value: unknown): string | null {
  const path = originPath(value);
  return path !== null && GATE_DOORS.has(firstSegment(path)) ? path : null;
}

/**
 * The gated page a visitor was sent to sign-in for, from a `callbackUrl`: the path of an entry door
 * (`gateDoor`), query and fragment dropped. Only an absolute path on this site qualifies, as the
 * sign-in card's own redirect rule defines it (`localCallbackPath`). Untrusted, so it fails closed.
 * It is not `from_path`: that is the page whose link was clicked.
 */
export function gatePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  const local = localCallbackPath(value, "");
  return local === "" ? null : gateDoor(new URL(local, BASE).pathname);
}

/**
 * The campaign tags and the page whose link was clicked (`from_path`), nothing else: a query can
 * carry a credential. What a link hands on, and what the proxy keeps when it redirects.
 */
export function sourceTags(search: string): URLSearchParams {
  const origin = originPath(new URLSearchParams(search).get(FROM_PATH_KEY));
  return new URLSearchParams([
    ...campaignTags(search),
    ...(origin === null ? [] : [[FROM_PATH_KEY, origin] as [string, string]]),
  ]);
}

/**
 * What a registration keeps from the sign-in page's own address: `sourceTags`, and the entry door
 * the proxy sent the visitor away from (`gate_path`), e.g. the lesson behind "Start the course".
 */
export function signupTags(search: string): URLSearchParams {
  const gate = gatePath(new URLSearchParams(search).get(CALLBACK_URL_KEY));
  return new URLSearchParams([
    ...sourceTags(search),
    ...(gate === null ? [] : [[GATE_PATH_KEY, gate] as [string, string]]),
  ]);
}

/**
 * A redirect target that keeps the source tags of the request it answers. The proxy sends an
 * anonymous visitor on to sign-in or a public lander, and a redirect that rebuilds the URL would
 * drop the tags a page's link handed on to a gated route.
 */
export function withSourceTags(target: URL, requestSearch: string): URL {
  const tagged = new URL(target);
  for (const [key, value] of sourceTags(requestSearch)) {
    if (!tagged.searchParams.has(key)) tagged.searchParams.set(key, value);
  }
  return tagged;
}

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
