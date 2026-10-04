import type { PreviewImage } from "@/components/shared/ImagePreview";

/** The app at 1600×900, captured at twice the size, one file per language (DE, EN). */
const SIZE = { width: 3200, height: 1800 } as const;

/**
 * The walkthrough screenshots on the landing page, each in `public/images/durchgang/promises/`
 * as `{de,en}-{file}.webp`, with the point its zoom glides to, as fractions of the image: the
 * part of the screen that proves the sentence beside it. The scale is set for where the image
 * sits: the small cards of the last section zoom deeper than the large frames above them.
 */
export const SHOTS = {
  path: { file: "1", focus: { x: 0.84, y: 0.27, scale: 3 } },
  explain: { file: "explain", focus: { x: 0.41, y: 0.64, scale: 2.2 } },
  bsiMethod: { file: "bsi-method", focus: { x: 0.445, y: 0.6, scale: 1.9 } },
  riskMap: { file: "risk-map", focus: { x: 0.445, y: 0.67, scale: 1.85 } },
  setAside: { file: "3", focus: { x: 0.86, y: 0.3, scale: 2.4 } },
  approved: { file: "approved", focus: { x: 0.445, y: 0.6, scale: 2 } },
  assetList: { file: "asset-list", focus: { x: 0.41, y: 0.55, scale: 2.3 } },
  activityLog: { file: "activity-log", focus: { x: 0.43, y: 0.25, scale: 2.4 } },
  export: { file: "export", focus: { x: 0.38, y: 0.23, scale: 2.6 } },
} as const satisfies Record<
  string,
  { readonly file: string; readonly focus: NonNullable<PreviewImage["focus"]> }
>;

export type ShotName = keyof typeof SHOTS;

/** The screenshot in the reader's language; every language but German shows the English set. */
export const shotImage = (name: ShotName, locale: string, alt: string): PreviewImage => ({
  ...SIZE,
  src: `/images/durchgang/promises/${locale === "de" ? "de" : "en"}-${SHOTS[name].file}.webp`,
  alt,
  focus: SHOTS[name].focus,
});

/**
 * The `sizes` that keeps a screenshot sharp at its deepest zoom: its width on the page times the
 * zoom, `wide` CSS pixels from the large breakpoint up and the whole viewport below it.
 */
export const zoomSizes = (name: ShotName, wide: number): string => {
  const { scale } = SHOTS[name].focus;
  return `(min-width: 1024px) ${Math.ceil(wide * scale)}px, ${Math.ceil(100 * scale)}vw`;
};
