/**
 * The Google Ads tag settings, as a slice of the environment schema (lib/env.ts).
 *
 * Both are public in the page source, so neither is a secret. Unset means no tag, no banner and no
 * Google origin in the CSP, which is what every self-hosted copy gets. A wrong value switches the
 * tag off; it never stops the application starting.
 */
import { z } from "zod";
import { trimmed } from "@/lib/env-value";

const optional = z.preprocess(trimmed, z.string().optional());

export const googleAdsEnvShape = {
  /** The Ads account's tag ID, e.g. "AW-" followed by digits. */
  GOOGLE_ADS_TAG_ID: optional,
  /** The conversion action's label, the part after the slash in `send_to`. */
  GOOGLE_ADS_CONVERSION_LABEL: optional,
};

export interface GoogleAdsConfig {
  readonly tagId: string;
  readonly conversionLabel: string;
}

/** Index-signature shaped so `process.env` satisfies it directly. */
type GoogleAdsEnv = { readonly [key: string]: string | undefined };

const TAG_PREFIX = "AW-";
const isDigits = (s: string): boolean =>
  s !== "" && [...s].every((c) => c >= "0" && c <= "9");
/** Letters, digits, dash and underscore: what Google issues, and safe to hand to the tag as data. */
const LABEL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const isLabel = (s: string): boolean =>
  s !== "" && s.length <= 64 && [...s].every((c) => LABEL_CHARS.includes(c));

/** Null unless both settings are present and shaped like the ones Google issues. */
export function googleAdsConfig(env: GoogleAdsEnv): GoogleAdsConfig | null {
  const { GOOGLE_ADS_TAG_ID: tagId, GOOGLE_ADS_CONVERSION_LABEL: conversionLabel } = env;
  if (!tagId || !conversionLabel) return null;
  if (!tagId.startsWith(TAG_PREFIX) || !isDigits(tagId.slice(TAG_PREFIX.length)))
    return null;
  if (!isLabel(conversionLabel)) return null;
  return { tagId, conversionLabel };
}
