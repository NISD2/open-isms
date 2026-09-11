/**
 * Chart palette for the Graphs tab.
 *
 * Four categorical slots in a fixed order (blue, orange, aqua, yellow) plus a
 * five-step single-hue blue ramp for the one place a magnitude is coloured (the
 * cohort heatmap). Colour follows the series, never its rank, so filtering the
 * range never repaints a chart.
 *
 * Both columns are selected, not flipped: the dark values are the same four
 * hues re-stepped for the dark card. Validated against this app's card
 * surfaces (#ffffff light, #171717 dark) — lightness band, chroma floor,
 * colour-vision-deficiency separation and normal-vision separation all pass in
 * both modes (worst adjacent pair: yellow/aqua, CVD dE 9.1 light and 8.4 dark).
 * On white, aqua (2.82:1) and yellow (2.17:1) fall under 3:1, which is why
 * every card here prints its numbers as text and carries a table view: colour
 * is never the only way to read a value.
 */

/**
 * Injected once by the panel. A style element rather than a token in
 * theme.css: these four slots exist for this tab and nothing else renders
 * against them, so they should not enter the app-wide token surface.
 */
export const VIZ_PALETTE_CSS = `
[data-viz] {
  --viz-1: #2a78d6;
  --viz-2: #eb6834;
  --viz-3: #1baf7a;
  --viz-4: #eda100;
  --viz-track: #edecea;
  --viz-muted: #c3c2b7;
  --viz-heat-0: #f5f5f3;
  --viz-heat-1: #cde2fb;
  --viz-heat-2: #9ec5f4;
  --viz-heat-3: #5598e7;
  --viz-heat-4: #256abf;
  --viz-heat-5: #184f95;
}
.dark [data-viz] {
  --viz-1: #3987e5;
  --viz-2: #d95926;
  --viz-3: #199e70;
  --viz-4: #c98500;
  --viz-track: #262625;
  --viz-muted: #55554f;
  --viz-heat-0: #202020;
  --viz-heat-1: #16304f;
  --viz-heat-2: #184f95;
  --viz-heat-3: #2a78d6;
  --viz-heat-4: #5598e7;
  --viz-heat-5: #9ec5f4;
}
`;

/** The four categorical slots, addressed by their fixed position. */
export const VIZ = {
  slot1: "var(--viz-1)",
  slot2: "var(--viz-2)",
  slot3: "var(--viz-3)",
  slot4: "var(--viz-4)",
} as const;

export type VizSlot = keyof typeof VIZ;

/**
 * Heat step for a 0-1 magnitude. Step 0 is the near-surface tint that means
 * "nothing here", so an empty cohort cell recedes instead of reading as data.
 */
export function heatColor(fraction: number): string {
  if (fraction <= 0) return "var(--viz-heat-0)";
  if (fraction < 0.2) return "var(--viz-heat-1)";
  if (fraction < 0.4) return "var(--viz-heat-2)";
  if (fraction < 0.6) return "var(--viz-heat-3)";
  if (fraction < 0.8) return "var(--viz-heat-4)";
  return "var(--viz-heat-5)";
}

/**
 * Ink for a label sitting inside a heat cell: white once the fill is dark
 * enough that body ink stops clearing contrast. The light ramp darkens with
 * magnitude and the dark ramp lightens with it, so the flip happens at
 * opposite ends and each mode names its own.
 */
export function heatInk(fraction: number): string {
  return fraction >= 0.6 ? "text-white dark:text-neutral-900" : "text-foreground";
}
