import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

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

function isProtected(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(de|en|nl)(?=\/|$)/, "") || "/";
  return protectedPrefixes.some(
    (p) => stripped === p || stripped.startsWith(p + "/")
  );
}

export function proxy(request: NextRequest) {
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

  // Check auth for protected routes only
  if (isProtected(pathname)) {
    const token =
      request.cookies.get("__Secure-authjs.session-token") ??
      request.cookies.get("authjs.session-token");

    if (!token) {
      const signinUrl = new URL("/auth/signin", request.url);
      signinUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  // Pass locale-stripped pathname to server components
  const stripped = pathname.replace(/^\/(de|en|nl)(?=\/|$)/, "") || "/";
  response.headers.set("x-pathname", stripped);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|site\\.webmanifest|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
