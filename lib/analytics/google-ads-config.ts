/**
 * The Google Ads tag settings, as a slice of the environment schema (lib/env.ts).
 *
 * Both are public in the page source, so neither is a secret. Unset means no tag, no banner and no
 * Google origin in the CSP, which is what every self-hosted copy gets. A wrong value switches the
 * tag off; it never stops the application starting. What counts as valid lives in
 * lib/analytics/google-ads-tag.ts, shared with the CSP.
 */
import { z } from "zod";
import { trimmed } from "@/lib/env-value";

export { type GoogleAdsConfig, googleAdsTag as googleAdsConfig } from "./google-ads-tag";

const optional = z.preprocess(trimmed, z.string().optional());

export const googleAdsEnvShape = {
  /** The Ads account's tag ID, e.g. "AW-" followed by digits. */
  GOOGLE_ADS_TAG_ID: optional,
  /** The conversion action's label, the part after the slash in `send_to`. */
  GOOGLE_ADS_CONVERSION_LABEL: optional,
};
