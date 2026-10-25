import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { expandPaths, underAny } from "@/i18n/expand-paths";
import { routing } from "@/i18n/routing";
import { isActivePromo, PROMO_COOKIE, PROMO_COOKIE_MAX_AGE_S } from "@/lib/billing/promo";
import { isNisd2Only, NISD2_ONLY_PATHS, NISD2_ORIGIN, SELF_HOSTED } from "@/lib/edition";
import { env } from "@/lib/env";
import { CANONICAL_PUBLIC_EXACT, CANONICAL_PUBLIC_PREFIXES } from "@/lib/public-paths";
import { buildCsp } from "@/lib/security/csp";

const handleI18n = createIntlMiddleware(routing);

/**
 * Auth.js v5 cookie name + salt. Both must be the same string (Auth.js
 * derives the JWE encryption salt from the cookie name via HKDF) or
 * `getToken` returns null on every request. See audit M-3 take 2
 * (commit e351163) for the history. `__Secure-` prefix on HTTPS,
 * bare cookie name on HTTP dev.
 */
function getAuthCookieName(isSecure: boolean): string {
  return isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

// The public allowlist and why it is one: lib/public-paths.ts.
const { exact: PUBLIC_EXACT, prefixes: PUBLIC_PREFIXES } = expandPaths(
  CANONICAL_PUBLIC_EXACT,
  CANONICAL_PUBLIC_PREFIXES,
);

// nisd2.eu's own pages, which the self-hosted image leaves out (lib/edition), in every locale.
const { prefixes: NISD2_ONLY_PREFIXES } = expandPaths([], NISD2_ONLY_PATHS);

// Derived from routing.locales so newly added locales are stripped too,
// instead of a hardcoded de|en|nl list that silently 404s/redirects new ones.
const LOCALE_STRIP = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`, "i");

// Non-default locale prefixes (the default locale has no URL prefix).
const NON_DEFAULT_LOCALE_PREFIX = new RegExp(
  `^/(${routing.locales.filter((l) => l !== routing.defaultLocale).join("|")})(?:/|$)`,
  "i",
);

/**
 * Gated roots an anonymous visitor is expected to reach cold → the public
 * page to send them to instead of the sign-in form.
 *
 * `/portal/supplier` is the URL that actually gets shared with a supplier
 * ("fill this in for us"), and a supplier who has never heard of us has
 * nothing to sign in with. Sending them to /auth/signin loses them at the
 * door.
 *
 * `/journey` is the same shape of problem found later in analytics: it is
 * the surface people link to and search for, and it had the highest
 * return rate on the site (1.65 visits per visitor) while an anonymous
 * hit got nothing but a login form.
 *
 * It points at /start rather than /journey-preview: the preview route
 * calls notFound() when NODE_ENV === "production" on purpose — it is a
 * screenshot rig for the landing hero, rendering a fake company's board
 * with a sidebar full of gated links, not a marketing surface. Sending
 * real traffic there would 404. /start is the actual public pre-login
 * entry page, and it recorded zero visits in the 30 days to 2026-08-31,
 * so it was getting no traffic from anywhere.
 *
 * Only the EXACT root redirects. Deep links below it
 * (/portal/supplier/profile, /practices, per-customer pages) keep going to
 * signin with callbackUrl — those are app URLs someone reaches after they
 * already have an account.
 *
 * Targets resolve per locale from routing.pathnames so NL lands on
 * /nl/leveranciersportaal rather than eating a second redirect hop. A
 * target that is not in routing.pathnames (like /journey-preview) is
 * locale-stable and falls through to itself.
 *
 * A self-hosted install has neither lander, so its visitors go to sign-in as on any other page.
 */
const ANONYMOUS_LANDER_TARGETS: Record<string, string> = Object.fromEntries(
  Object.entries({
    "/portal/supplier": "/supplier-portal",
    "/journey": "/start",
  }).filter(([, target]) => !(SELF_HOSTED && isNisd2Only(target))),
);

function landerByLocale(target: string): Record<string, string> {
  const pathnames = routing.pathnames as Record<
    string,
    string | Record<string, string | undefined> | undefined
  >;
  const mapping = pathnames[target];
  const out: Record<string, string> = {};
  for (const locale of routing.locales) {
    out[locale] = (typeof mapping === "string" ? mapping : mapping?.[locale]) ?? target;
  }
  return out;
}

const ANONYMOUS_LANDERS: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(ANONYMOUS_LANDER_TARGETS).map(([root, target]) => [
    root,
    landerByLocale(target),
  ]),
);

/** The URL prefix of a non-default locale in `pathname` ("/en"), or "" for the default. */
function localePrefixOf(pathname: string): string {
  const match = pathname.match(NON_DEFAULT_LOCALE_PREFIX);
  return match ? `/${match[1].toLowerCase()}` : "";
}

/**
 * Locale-prefixed lander for an anonymous hit on `strippedPath`, or null
 * when that path has no lander and should go to signin as before.
 */
function anonymousLanderPath(pathname: string, strippedPath: string): string | null {
  const byLocale = ANONYMOUS_LANDERS[strippedPath];
  if (!byLocale) return null;
  const match = pathname.match(NON_DEFAULT_LOCALE_PREFIX);
  const locale = match ? match[1].toLowerCase() : routing.defaultLocale;
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${byLocale[locale] ?? ANONYMOUS_LANDER_TARGETS[strippedPath]}`;
}

function isPublic(pathname: string): boolean {
  const stripped = pathname.replace(LOCALE_STRIP, "") || "/";
  return PUBLIC_EXACT.has(stripped) || underAny(stripped, PUBLIC_PREFIXES);
}

/**
 * On a self-hosted install, where a request for a page it does not have goes: nisd2.eu's own
 * pages to the same address at nisd2.eu, and the home page to the app. Null for every other page.
 *
 * The image does not contain those pages at all (scripts/self-host-strip.mjs), so this is how
 * every link to them, old bookmarks and old emails reach nisd2.eu. The browser keeps the install's
 * address as referrer across the redirect (Referrer-Policy in next.config.ts).
 */
function selfHostedRedirect(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const stripped = pathname.replace(LOCALE_STRIP, "") || "/";
  if (stripped === "/") {
    return NextResponse.redirect(
      new URL(`${localePrefixOf(pathname)}/dashboard`, request.url),
    );
  }
  if (!underAny(stripped, NISD2_ONLY_PREFIXES)) return null;
  return NextResponse.redirect(new URL(`${pathname}${search}`, NISD2_ORIGIN), 308);
}

// EMD redirect: sicherheitsfragebogen.de is a brand-billboard domain.
// All traffic 301s to nisd2.eu/sicherheitsfragebogen/* so ranking signals
// and auth cookies stay single-host. Coolify still terminates TLS for the
// EMD; the redirect happens here before the app renders anything.
const FRAGEBOGEN_HOSTS = new Set([
  "sicherheitsfragebogen.de",
  "www.sicherheitsfragebogen.de",
]);

async function route(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHost = request.headers.get("host")?.toLowerCase() ?? "";
  if (FRAGEBOGEN_HOSTS.has(requestHost)) {
    // Preserve locale prefix (EN, NL), drop /de since DE is the default
    // locale and has no URL prefix on nisd2.eu. Subpaths are dropped —
    // the EMD has no canonical content beyond root; redirecting deep
    // links to the wedge landing is the safe default.
    const target = new URL(
      `https://nisd2.eu${localePrefixOf(pathname)}/sicherheitsfragebogen`,
    );
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // Before the bypass below, which lets /docs through.
  const away = SELF_HOSTED ? selfHostedRedirect(request) : null;
  if (away) return away;

  // EW-5: strip any inbound x-pathname header before downstream
  // handlers see it. Only the proxy is allowed to set this for server
  // components.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-pathname");

  // Bypass paths — handled by route handlers or no auth meaningful.
  if (
    pathname.startsWith("/api/") ||
    // The open-isms developer and operator documentation. It lives outside
    // app/[locale] because it is English only with one canonical URL per
    // page, so the i18n middleware must not rewrite it into a locale segment
    // that has no route. Public by definition: it is the install guide for
    // software anyone can download.
    pathname === "/docs" ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/pitch-preview") ||
    // Both email-link landing pages, and for the same reason: they are opened
    // from a mail client with no session, and their credential is the HMAC
    // token in the URL rather than a cookie. Sending them through the
    // default-deny gate redirects the reader to a sign-in screen, which for
    // an unsubscribe surface is worse than a dead link — it reads as being
    // made to create an account in order to stop receiving email.
    pathname.startsWith("/email/unsubscribed") ||
    pathname.startsWith("/email/preferences") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/site.webmanifest"
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Run i18n middleware (handles locale detection, redirects, rewrites)
  const response = handleI18n(request);

  // Default-deny: unless the path is in the public allowlist, require
  // a validly-signed JWT. Walks through the same getToken contract as
  // M-3 (commit e351163) — explicit cookieName + salt + secureCookie
  // because Auth.js v5 derives the encryption salt from the cookie name.
  if (!isPublic(pathname)) {
    const token = await sessionToken(request);

    if (!token) {
      // The protected roots an anonymous visitor is expected to arrive at
      // cold get a public lander instead of the login form. Everything
      // deeper still walls.
      const lander = anonymousLanderPath(
        pathname,
        pathname.replace(LOCALE_STRIP, "") || "/",
      );
      if (lander) {
        return NextResponse.redirect(new URL(lander, request.url));
      }
      const signinUrl = new URL("/auth/signin", request.url);
      signinUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  // Pass locale-stripped pathname to server components via response
  // header. (Note: this writes the response header, not the request
  // header that headers() reads; full EW-5 coverage on the non-bypass
  // path is a follow-up.)
  const stripped = pathname.replace(LOCALE_STRIP, "") || "/";
  response.headers.set("x-pathname", stripped);

  return response;
}

/**
 * Every response leaves with a Content-Security-Policy computed now, not the
 * one frozen into next.config.ts when the image was built.
 *
 * Only `connect-src` actually differs, and only by the storage origin, but it
 * is the difference between a self-hoster's evidence uploads working and being
 * blocked by an origin belonging to whoever ran the build. Set here rather than
 * at each return so a new branch cannot forget it.
 *
 * A self-hosted install is someone's compliance app, never a search result.
 */
export async function proxy(request: NextRequest) {
  const response = await route(request);
  response.headers.set("Content-Security-Policy", buildCsp(process.env));
  if (SELF_HOSTED) response.headers.set("X-Robots-Tag", "noindex");
  await rememberPromo(request, response);
  return response;
}

/**
 * Mirror Auth.js's own secure-cookie decision: it derives the cookie name from
 * AUTH_URL's protocol when set. NODE_ENV alone misfires on a production build
 * served over plain http (local e2e stack, self-hosts behind an external TLS
 * terminator): Auth.js writes the non-secure cookie while a check would look for
 * the __Secure- name, so no login could ever pass the default-deny.
 */
function authCookiesSecure(request: NextRequest): boolean {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  return authUrl
    ? authUrl.startsWith("https")
    : request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
}

/**
 * The signed-in session, or null. The same getToken contract as M-3 (commit
 * e351163): explicit cookieName + salt + secureCookie, because Auth.js v5 derives
 * the encryption salt from the cookie name.
 */
async function sessionToken(request: NextRequest) {
  const isSecure = authCookiesSecure(request);
  const cookieName = getAuthCookieName(isSecure);
  return getToken({
    req: request,
    secret: env.AUTH_SECRET,
    cookieName,
    salt: cookieName,
    secureCookie: isSecure,
  });
}

/**
 * A signed-out visitor who opens any page with `?promo=<the active code>` has the
 * code remembered for their next sign-in, which applies it (lib/auth/config.ts).
 * A cookie, because the sign-in that follows may go through Google or an emailed
 * code first; SameSite=lax survives Google's redirect back. A signed-in visitor
 * gets the promo on the page itself (lib/billing/promo-session.ts), so no cookie
 * is left for the next person on the browser. An unknown or expired code sets
 * nothing.
 */
async function rememberPromo(request: NextRequest, response: NextResponse) {
  const code = request.nextUrl.searchParams.get("promo");
  if (code === null || !isActivePromo(code, env)) return;
  if (await sessionToken(request)) return;
  response.cookies.set(PROMO_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: authCookiesSecure(request),
    maxAge: PROMO_COOKIE_MAX_AGE_S,
    path: "/",
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|site\\.webmanifest|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
