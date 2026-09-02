/**
 * Design tokens for every generated PDF.
 *
 * One home for the values a document is not allowed to invent. Before this
 * file the certificate, the compliance report, the gap assessment and the
 * supplier questionnaire each carried their own greys and their own idea of a
 * heading, so a brand change meant editing four files and the four documents
 * drifted apart in between.
 *
 * Colours mirror the CSS custom properties in app/globals.css so a printed
 * document and the screen it came from read as the same product.
 *
 * Pure data: no JSX, no react-pdf imports. `brand.tsx` draws the marks,
 * `styles.ts` turns these into a StyleSheet, `chrome.tsx` assembles the page
 * furniture. Documents consume those, not raw hex.
 */

export const BRAND = {
  primary: "#284b63",
  primaryDeep: "#1d3a4d",
  accent: "#3c6e71",
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  rule: "#e2e8f0",
  ruleStrong: "#cbd5e1",
  surface: "#f8fafc",
  paper: "#ffffff",
} as const;

/**
 * Review states of a requirement or submission. Tinted plates rather than
 * saturated fills: a report is read on paper and often photocopied, so the
 * label has to survive greyscale, which means the text carries the meaning and
 * the background only groups it.
 */
export const STATUS = {
  approved: { bg: "#e8f2ec", fg: "#1d5c43" },
  completed: { bg: "#e9eff4", fg: BRAND.primary },
  rejected: { bg: "#f8eaea", fg: "#8c2f2f" },
  neutral: { bg: BRAND.surface, fg: BRAND.muted },
} as const;

export type StatusTone = keyof typeof STATUS;

/**
 * Ordinal scale for scores and severities. Muted against the house palette
 * rather than the sRGB-corner traffic lights the gap assessment used, which
 * fought the rest of the page for attention and printed as mud.
 */
export const SIGNAL = {
  strong: "#3f7d62",
  good: BRAND.accent,
  fair: "#c08a3e",
  weak: "#bd6b3c",
  poor: "#a94f4f",
} as const;

/** Callout tones. `caution` carries the draft/unapproved banner. */
export const CALLOUT = {
  caution: { bg: "#fdf6e8", border: "#d9ae5e", fg: "#7a5312" },
  note: { bg: BRAND.surface, border: BRAND.ruleStrong, fg: BRAND.body },
  alert: { bg: "#f9eeee", border: "#c98a8a", fg: "#8c2f2f" },
} as const;

export type CalloutTone = keyof typeof CALLOUT;

/**
 * Page geometry. The horizontal margin is the anchor: fixed page furniture is
 * positioned against it, so a footer cannot drift away from the text column
 * the way it did when each document hardcoded its own inset.
 */
export const PAGE = {
  marginX: 48,
  top: 38,
  bottom: 34,
  /** Cover pages breathe wider than body pages. */
  coverMarginX: 56,
} as const;

/** Type scale. Named so a heading is chosen, not measured. */
export const TYPE = {
  micro: 6.5,
  caption: 7,
  fine: 7.5,
  small: 8.3,
  body: 9,
  lead: 10.5,
  h4: 10.5,
  h3: 12,
  h2: 15,
  h1: 24,
  display: 33,
} as const;

/** Hairlines. 0.75 is the thinnest rule that survives a 300dpi office printer. */
export const RULE = { hair: 0.75, thin: 1 } as const;

export const RADIUS = { sm: 3, md: 6, pill: 999 } as const;

/** Letterspaced uppercase labels are the one recurring typographic gesture. */
export const EYEBROW = {
  fontSize: TYPE.micro,
  fontWeight: 500 as const,
  letterSpacing: 1.3,
  textTransform: "uppercase" as const,
  color: BRAND.faint,
};

export const ISSUER = {
  name: "NISD2.eu",
  url: "www.nisd2.eu",
} as const;
