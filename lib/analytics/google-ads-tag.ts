/**
 * Whether Google Ads measurement is configured, and with what. One rule for everyone who asks: the
 * layout, the footer and the CSP, so the tag cannot be off while the CSP is open for Google (or the
 * reverse). A leaf with no imports, because next.config.ts loads the CSP, and the CSP loads this,
 * and neither can resolve the `@/` alias.
 */

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

/**
 * Null unless both settings are present and shaped like the ones Google issues. Trimmed here,
 * because a value pasted into a hosting panel often carries a trailing newline.
 */
export function googleAdsTag(env: GoogleAdsEnv): GoogleAdsConfig | null {
  const tagId = env.GOOGLE_ADS_TAG_ID?.trim();
  const conversionLabel = env.GOOGLE_ADS_CONVERSION_LABEL?.trim();
  if (!tagId || !conversionLabel) return null;
  if (!tagId.startsWith(TAG_PREFIX) || !isDigits(tagId.slice(TAG_PREFIX.length)))
    return null;
  if (!isLabel(conversionLabel)) return null;
  return { tagId, conversionLabel };
}
