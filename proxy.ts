import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

const handleI18n = createIntlMiddleware(routing);

/**
 * Auth.js v5 cookie name + salt. The cookie name carries the `__Secure-`
 * prefix on HTTPS (production) and is bare on HTTP (local dev). Auth.js
 * derives the JWE encryption salt from the cookie name via HKDF, so
 * `getToken` MUST be passed the same string for both, otherwise
 * decryption fails silently and the proxy thinks the user is logged out.
 *
 * The previous version of this file used the v4 cookie names
 * (`next-auth.session-token`) and let `getToken` pick its own salt, which
 * is what broke login on 2026-06-10 (commit 05f2aa4 → e31d39b revert).
 * Audit M-3 (2026-06-10).
 */
function getAuthCookieName(isSecure: boolean): string {
  return isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

/** Protected route prefixes — everything else is public by default */
const protectedPrefixes = [
  "/dashboard",
  "/compliance",
  "/audit",
  "/audit-readiness",
  "/assets",
  "/risks",
  "/suppliers",
  "/policies",
  "/incidents",
  "/exercises",
  "/kpis",
  "/changes",
  "/patches",
  "/vulnerabilities",
  "/internal-audits",
  "/improvements",
  "/management-reviews",
  "/training/courses",
  "/team",
  "/review",
  "/export",
  "/notifications",
  "/organization",
  "/settings",
  "/onboarding",
  "/portal/supplier",
  "/platform-admin",
];

// Audit M-3 (2026-06-10): case-insensitive locale strip — the old
// `/(de|en|nl)/` regex passed `/DE/dashboard` through unchanged and
// relied on next-intl to redirect before the prefix check fired.
const LOCALE_STRIP = /^\/(de|en|nl)(?=\/|$)/i;

function isProtected(pathname: string): boolean {
  const stripped = pathname.replace(LOCALE_STRIP, "") || "/";
  return protectedPrefixes.some(
    (p) => stripped === p || stripped.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, .well-known, static metadata files, and internal tools
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/pitch-preview") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/site.webmanifest"
  ) {
    return NextResponse.next();
  }

  // Run i18n middleware (handles locale detection, redirects, rewrites)
  const response = handleI18n(request);

  // Audit M-3 (2026-06-10): cryptographic JWT verification, not cookie
  // presence. The previous cookie-check accepted any value at the proxy
  // gate and relied on every protected page to re-check via getSession().
  // `getToken` validates the JWE signature against AUTH_SECRET and
  // returns null for missing, tampered, or expired tokens.
  //
  // Auth.js v5 derives the encryption salt from the cookie name, so
  // `cookieName` and `salt` must be passed the SAME string. Defaults
  // diverge between getToken's heuristics and the runtime's actual
  // cookie convention, which is what broke login on the first attempt
  // (commit 05f2aa4 → reverted in e31d39b). Always pass both explicitly.
  if (isProtected(pathname)) {
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

  // Pass locale-stripped pathname to server components
  const stripped = pathname.replace(LOCALE_STRIP, "") || "/";
  response.headers.set("x-pathname", stripped);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|site\\.webmanifest|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
