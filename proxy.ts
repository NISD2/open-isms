import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

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

/**
 * Public route allowlist — default-deny inversion (audit followup,
 * 2026-06-11). Every route in the app falls into one of three buckets:
 *
 *   1. BYPASS — early return at the top of proxy(). Route handlers do
 *      their own auth (API routes, the trpc dispatcher), or no auth is
 *      meaningful (static metadata, internal screenshot route).
 *
 *   2. PUBLIC — the canonical (DE-keyed) path appears below in
 *      CANONICAL_PUBLIC_EXACT or CANONICAL_PUBLIC_PREFIXES. The
 *      expansion walks routing.pathnames at module init and adds every
 *      localized variant, so `/privacy` (EN/NL) gets the same
 *      classification as `/datenschutz` (DE). The next-intl pathname
 *      map is the single source of truth — the two structures cannot
 *      drift apart, and adding a new public page in routing.ts
 *      automatically opens it across all three locales.
 *
 *   3. PROTECTED — everything else. Default behavior. Proxy requires a
 *      validly-signed JWT; missing or expired tokens redirect to
 *      /auth/signin with callbackUrl preserved.
 *
 * The previous shape was an explicit *protected* allowlist. That had
 * the failure mode "forgot to add a new protected route to the list".
 * Inverting to a public allowlist makes the failure mode "forgot to add
 * a new public route to the list" — same shape but now functional
 * (users see a redirect on a public page) instead of structural (a
 * protected page silently leaks data without ever asking for auth).
 *
 * Pages that the inversion newly proxy-enforces (each ALREADY had a
 * page-level `getSession()` + redirect, so behavior is unchanged — the
 * inversion is defense in depth):
 *   - /applicability-admin
 *   - /journey
 *   - /supplier-invite/[token]
 *   - /portal/supplier-onboarding (the old `/portal/supplier` prefix
 *     match missed this because `supplier-onboarding` has no slash
 *     after `supplier`)
 *
 * /invite/[token] is also newly enforced. The invite page itself
 * renders a public "invalid/expired" card for missing tokens, so the
 * inversion changes UX slightly (signin redirect with callbackUrl
 * instead of the invalid-card page for unauthenticated visitors with a
 * good token), but the underlying acceptance flow stays gated.
 */
const CANONICAL_PUBLIC_EXACT: readonly string[] = [
  "/",
  // Marketing / info pages — every page under app/[locale]/(info)/
  "/about",
  "/avv",
  "/changelog",
  "/corrections",
  "/datenschutz",
  "/ethik",
  "/features",
  "/finanzierung",
  "/impressum",
  "/mission",
  "/nis2-lieferanten-fragebogen",
  "/nis2-meldepflicht-schema",
  "/nis2-tool",
  "/open-source",
  "/pricing",
  "/redaktion",
  "/sicherheit",
  "/status",
  "/subprozessoren",
  "/terms",
  "/toms",
  "/vertrauen",
  // Public course landing pages — under (info)/training/
  "/training/cra-sbom",
  "/training/nis2-ceo",
  "/training/nis2-tabletop",
  // Standalone public pages
  "/applicability",
  "/risikobewertung",
  "/strukturanalyse",
  "/start",
  "/pitch",
  "/supplier-portal",
];

const CANONICAL_PUBLIC_PREFIXES: readonly string[] = [
  // Wiki — /wiki itself + every nested category and article. The /wiki
  // segment is locale-stable; only the category and article slugs
  // change between locales, so the prefix match alone covers all three.
  "/wiki",
  // sicherheitsfragebogen.de wedge — single landing page + future
  // programmatic SEO subtrees. Same slug across all three locales so a
  // prefix entry suffices.
  "/sicherheitsfragebogen",
  // Auth flow pages — /auth/signin, /auth/forgot-password, /auth/signout
  "/auth",
  // Author bios — /autor/[slug] (DE), /author/[slug] (EN), /auteur/[slug] (NL)
  "/autor",
  // Shared gap assessment — token IS the authentication mechanism
  "/gap-assessment/share",
  // Supplier-relationship access — token-gated landing for external suppliers
  "/supplier-access",
];

type PathnameMapping = string | Partial<Record<string, string>>;

/**
 * Expand each canonical (DE-keyed) public path/prefix to all locale
 * variants via routing.pathnames lookup. Resolves the localized-slug
 * blocker found during PR #14 review: `/datenschutz` is canonical, but
 * EN/NL users hit `/privacy` and the proxy never saw it; same for
 * `/toepasselijkheid`, `/leveranciersportaal`, `/author/[slug]`, etc.
 */
function expandPublicPaths(): {
  exact: ReadonlySet<string>;
  prefixes: readonly string[];
} {
  const pathnames = routing.pathnames as Record<string, PathnameMapping>;
  const exact = new Set<string>();
  const prefixes = new Set<string>();

  for (const canonical of CANONICAL_PUBLIC_EXACT) {
    exact.add(canonical);
    const mapping = pathnames[canonical];
    if (mapping && typeof mapping === "object") {
      for (const localized of Object.values(mapping)) {
        if (localized) exact.add(localized);
      }
    }
  }

  for (const canonical of CANONICAL_PUBLIC_PREFIXES) {
    prefixes.add(canonical);
    // Walk all routing entries: when a canonical key sits under this
    // prefix and the entry is localized, derive the localized prefix
    // root by stripping the trailing suffix shared with the canonical
    // key. e.g. canonical="/autor", key="/autor/simon-orzel",
    // mapping.en="/author/simon-orzel" → localized prefix "/author".
    for (const [key, mapping] of Object.entries(pathnames)) {
      const isUnderPrefix =
        key === canonical || key.startsWith(canonical + "/");
      if (!isUnderPrefix) continue;
      if (!mapping || typeof mapping !== "object") continue;
      const suffix = key.slice(canonical.length);
      for (const localized of Object.values(mapping)) {
        if (!localized) continue;
        if (suffix && !localized.endsWith(suffix)) continue;
        const localizedRoot = suffix
          ? localized.slice(0, -suffix.length)
          : localized;
        if (localizedRoot) prefixes.add(localizedRoot);
      }
    }
  }

  return { exact, prefixes: [...prefixes] };
}

const { exact: PUBLIC_EXACT, prefixes: PUBLIC_PREFIXES } = expandPublicPaths();

// Derived from routing.locales so newly added locales are stripped too,
// instead of a hardcoded de|en|nl list that silently 404s/redirects new ones.
const LOCALE_STRIP = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`, "i");

// Non-default locale prefixes (the default locale has no URL prefix).
const NON_DEFAULT_LOCALE_PREFIX = new RegExp(
  `^/(${routing.locales.filter((l) => l !== routing.defaultLocale).join("|")})(?:/|$)`,
  "i",
);

function isPublic(pathname: string): boolean {
  const stripped = pathname.replace(LOCALE_STRIP, "") || "/";
  if (PUBLIC_EXACT.has(stripped)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (stripped === prefix || stripped.startsWith(prefix + "/")) {
      return true;
    }
  }
  return false;
}

// EMD redirect: sicherheitsfragebogen.de is a brand-billboard domain.
// All traffic 301s to nisd2.eu/sicherheitsfragebogen/* so ranking signals
// and auth cookies stay single-host. Coolify still terminates TLS for the
// EMD; the redirect happens here before the app renders anything.
const FRAGEBOGEN_HOSTS = new Set([
  "sicherheitsfragebogen.de",
  "www.sicherheitsfragebogen.de",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHost = request.headers.get("host")?.toLowerCase() ?? "";
  if (FRAGEBOGEN_HOSTS.has(requestHost)) {
    // Preserve locale prefix (EN, NL), drop /de since DE is the default
    // locale and has no URL prefix on nisd2.eu. Subpaths are dropped —
    // the EMD has no canonical content beyond root; redirecting deep
    // links to the wedge landing is the safe default.
    const localeMatch = pathname.match(NON_DEFAULT_LOCALE_PREFIX);
    const localePrefix = localeMatch ? `/${localeMatch[1].toLowerCase()}` : "";
    const target = new URL(`https://www.nisd2.eu${localePrefix}/sicherheitsfragebogen`);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // EW-5: strip any inbound x-pathname header before downstream
  // handlers see it. Only the proxy is allowed to set this for server
  // components.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-pathname");

  // Bypass paths — handled by route handlers or no auth meaningful.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/pitch-preview") ||
    pathname.startsWith("/email/unsubscribed") ||
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
    const isSecure =
      request.nextUrl.protocol === "https:" ||
      process.env.NODE_ENV === "production";
    const cookieName = getAuthCookieName(isSecure);
    const token = await getToken({
      req: request,
      secret: env.AUTH_SECRET,
      cookieName,
      salt: cookieName,
      secureCookie: isSecure,
    });

    if (!token) {
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|site\\.webmanifest|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
