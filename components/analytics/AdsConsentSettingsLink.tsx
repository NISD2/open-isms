"use client";

import { OPEN_SETTINGS_EVENT } from "@/lib/analytics/ads-consent";

/**
 * The footer's way back into the consent question, so withdrawing is as easy as agreeing. The
 * footer only renders it when a tag is configured.
 */
export function AdsConsentSettingsLink({ label }: { readonly label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {label}
    </button>
  );
}
