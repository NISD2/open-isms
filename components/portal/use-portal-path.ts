"use client";

import { useParams, usePathname } from "next/navigation";

/**
 * The current path with the locale prefix removed, so callers can compare
 * against plain portal routes like "/journey".
 *
 * Native next/navigation, deliberately: next-intl's usePathname returns the
 * route template ("/compliance/[categorySlug]"), which answers a different
 * question than "which page am I on".
 */
export function usePortalPath(): string {
  const pathname = usePathname();
  const { locale } = useParams<{ locale?: string }>();
  if (!locale) return pathname;

  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  return pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname;
}
