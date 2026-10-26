"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  bannerVisible,
  CONSENT_STORAGE_KEY,
  type Consent,
  OPEN_SETTINGS_EVENT,
  parseConsent,
  REGISTRATION_STARTED_EVENT,
} from "@/lib/analytics/ads-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GTAG_SRC = "https://www.googletagmanager.com/gtag/js";

const readConsent = (): Consent | null => {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
};

const writeConsent = (value: Consent): void => {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage blocked: the answer holds for this page view and the visitor is asked again next time.
  }
};

/** Google's measurement cookies on this site, named by prefix; withdrawing consent removes them. */
const clearGoogleCookies = (): void => {
  const names = document.cookie
    .split(";")
    .map((pair) => pair.split("=")[0]?.trim() ?? "")
    .filter((name) => name.startsWith("_gcl_") || name.startsWith("_gac_"));
  const host = window.location.hostname;
  const parent = host.split(".").slice(-2).join(".");
  for (const name of names) {
    for (const domain of [host, `.${host}`, `.${parent}`]) {
      expireCookie(`${name}=; Max-Age=0; Path=/; Domain=${domain}`);
    }
    expireCookie(`${name}=; Max-Age=0; Path=/`);
  }
};

const expireCookie = (setter: string): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: expiring a cookie by name; there is nothing to read back
  document.cookie = setter;
};

/**
 * Loads Google's tag, once, and only after a yes. The two Google consent signals this measurement
 * needs are granted; personalised ads and analytics storage stay denied, since we run neither.
 */
function loadTag(tagId: string): void {
  if (window.gtag) {
    // Loaded earlier on this page and then withdrawn: agreeing again only flips the signals back.
    window.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted" });
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js reads the `arguments` object itself, not an array, so a rest parameter would not work.
  window.gtag = function gtag() {
    // biome-ignore lint/complexity/noArguments: see above
    window.dataLayer?.push(arguments);
  };
  window.gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", tagId);
  const script = document.createElement("script");
  script.async = true;
  script.src = `${GTAG_SRC}?id=${encodeURIComponent(tagId)}`;
  document.head.appendChild(script);
}

/**
 * Google Ads conversion measurement behind a consent question.
 *
 * Renders nothing and loads nothing unless the operator set a tag (lib/analytics/google-ads-config.ts).
 * The banner shows only to a visitor who arrives with a Google click ID, or who opens the settings
 * from the footer. A link that starts registration reports it through REGISTRATION_STARTED_EVENT;
 * it becomes a conversion only when consent is granted.
 */
export function GoogleAdsTag({
  tagId,
  conversionLabel,
}: {
  readonly tagId: string;
  readonly conversionLabel: string;
}) {
  const t = useTranslations("common");
  const [consent, setConsent] = useState<Consent | null>(null);
  const [reopened, setReopened] = useState(false);
  const [search, setSearch] = useState("");
  const [landingPath, setLandingPath] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setSearch(window.location.search);
    setLandingPath(window.location.pathname);
    const stored = readConsent();
    setConsent(stored);
    if (stored === "granted") loadTag(tagId);
  }, [tagId]);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (consent !== "granted") return;
    const report = () =>
      window.gtag?.("event", "conversion", { send_to: `${tagId}/${conversionLabel}` });
    window.addEventListener(REGISTRATION_STARTED_EVENT, report);
    return () => window.removeEventListener(REGISTRATION_STARTED_EVENT, report);
  }, [consent, tagId, conversionLabel]);

  const answer = useCallback(
    (value: Consent) => {
      writeConsent(value);
      setConsent(value);
      setReopened(false);
      if (value === "granted") {
        loadTag(tagId);
        return;
      }
      window.gtag?.("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
      });
      clearGoogleCookies();
    },
    [tagId],
  );

  // Ignoring the question and reading on is an answer: it counts as no, and the banner does not
  // follow the visitor to the next page.
  const movedOn = landingPath !== null && pathname !== landingPath;
  if (!bannerVisible({ consent, search, reopened }) || (movedOn && !reopened))
    return null;

  return (
    <section
      aria-label={t("adsConsent.label")}
      className="fixed inset-x-3 bottom-3 z-50 rounded-lg border bg-background p-3 shadow-md sm:right-auto sm:max-w-sm"
    >
      <p className="text-sm text-muted-foreground">
        {t("adsConsent.body")}{" "}
        <Link
          href={{ pathname: "/datenschutz", hash: "cookies" }}
          className="underline underline-offset-2"
        >
          {t("adsConsent.more")}
        </Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={() => answer("denied")}>
          {t("adsConsent.decline")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => answer("granted")}>
          {t("adsConsent.accept")}
        </Button>
      </div>
    </section>
  );
}
