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
 * Query strings and fragments are never sent: sign-in carries an invite path in ?callbackUrl=,
 * and the asset inventory keeps a company's whole list in the fragment.
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
      data-exclude-search="true"
      data-exclude-hash="true"
      data-before-send={BEFORE_SEND}
    />
  );
}
