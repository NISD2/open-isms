import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

const handleI18n = createIntlMiddleware(routing);

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

  // Audit M-3 (2026-06-10): check auth via cryptographic JWT verification,
  // not cookie presence. The previous cookie-check accepted any value at
  // the proxy gate and relied on every protected page to call getSession()
  // independently. The moment one future page forgets that call, the
  // boundary leaks. getToken validates the JWT signature against
  // AUTH_SECRET and returns null for missing / tampered / expired tokens.
  if (isProtected(pathname)) {
    const token = await getToken({
      req: request,
      secret: env.AUTH_SECRET,
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
