/**
 * The brand for everything drawn outside the app's CSS: generated illustrations today,
 * carousels and documents when they move over. No colour is written here. Each role names
 * a custom property in the app theme, so a colour changes in one place and every consumer
 * follows. `scripts/guided-step-art/brand-tokens.ts` resolves the names to values.
 */
export const THEME_CSS = "packages/isms-ui/src/theme.css";

export const BRAND_COLORS = {
  ink: "--foreground",
  primary: "--primary",
  secondary: "--chart-2",
  surface: "--background",
  muted: "--muted",
  line: "--border",
  accent: "--chart-4",
  accentWarm: "--chart-5",
} as const satisfies Record<string, `--${string}`>;

export type BrandColor = keyof typeof BRAND_COLORS;

/**
 * Lighter versions of a brand colour, for large areas where the token itself reads too
 * heavy. Derived in OKLCH by raising the lightness and keeping the hue: mixing towards
 * white instead turns the blue grey. `chroma` scales the base colour's chroma.
 */
export const BRAND_TINTS = {
  primarySoft: { base: "primary", lightness: 0.7, chroma: 1.25 },
  primaryPale: { base: "primary", lightness: 0.96, chroma: 0.5 },
  secondarySoft: { base: "secondary", lightness: 0.72, chroma: 1.25 },
} as const satisfies Record<
  string,
  { base: BrandColor; lightness: number; chroma: number }
>;

export type BrandRole = BrandColor | keyof typeof BRAND_TINTS;

export const BRAND_MOTION = {
  easing: "--default-transition-timing-function",
} as const satisfies Record<string, `--${string}`>;
