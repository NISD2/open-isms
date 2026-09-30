"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { analyticsBeforeSend, isTokenRoute } from "@/lib/analytics/token-routes";

const BEFORE_SEND = "nisd2AnalyticsBeforeSend";

declare global {
  interface Window {
    [BEFORE_SEND]?: typeof analyticsBeforeSend;
  }
}

/**
 * The Umami tag, left out on pages whose URL is a credential (lib/analytics/token-routes.ts).
 * Fragments are never sent (the asset inventory keeps a company's whole list there), and the
 * before-send hook keeps only utm_* from the query string, since sign-in carries an invite path
 * in ?callbackUrl=.
 */
export function Analytics({ src, websiteId }: { src: string; websiteId: string }) {
  const pathname = usePathname();
  // Umami looks the hook up by name on every send, and the tag only runs after this effect.
  useEffect(() => {
    window[BEFORE_SEND] = analyticsBeforeSend;
  }, []);
  if (isTokenRoute(pathname)) return null;
  return (
    <Script
      defer
      src={src}
      data-website-id={websiteId}
      data-exclude-hash="true"
      data-before-send={BEFORE_SEND}
    />
  );
}
