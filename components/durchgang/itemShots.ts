import type { PreviewImage } from "@/components/shared/ImagePreview";
import { itemKey } from "@/lib/durchgang";

/**
 * The app at 1600×900, captured at twice the size and saved at one and a half times: at twice the
 * size the text-heavy screens weigh up to 200 KB, at this size each stays under 150 KB and is still
 * sharp at the deepest zoom below.
 */
const SIZE = { width: 2400, height: 1350 } as const;

type Focus = NonNullable<PreviewImage["focus"]>;
type Lang = "de" | "en";

/** The same point in both languages, where their screens lay out alike. */
const both = (focus: Focus): Readonly<Record<Lang, Focus>> => ({ de: focus, en: focus });

/**
 * One screen of each step of the walk, the one that shows best what the step leaves the company
 * with, taken from the made-up demo company Kemper & Lohse Fördertechnik GmbH. Each is in
 * `public/images/durchgang/items/` as `{de,en}-{itemKey}.webp`, with the point its preview zooms
 * into, as fractions of the image. An account that has not paid sees them on the locked home
 * (Simon, 04.10.2026). The screen index is the walk's `?s=`.
 *
 * German and English text wraps differently, so a screen's main block can sit higher in one
 * language than in the other; there each language has its own point, so the zoom never ends on
 * half a line.
 */
export const ITEM_SHOTS: Readonly<
  Partial<Record<string, Readonly<Record<Lang, Focus>>>>
> = {
  // The walk's setup step for a company not set up yet: the three essentials, filled in.
  unternehmen: both({ x: 0.58, y: 0.58, scale: 2 }),
  "12.2": both({ x: 0.44, y: 0.6, scale: 2.2 }), // s=1: the country and its authority
  "1.1": both({ x: 0.44, y: 0.59, scale: 2.2 }), // s=2: one training line per manager
  "2.1": both({ x: 0.44, y: 0.66, scale: 1.8 }), // s=1: the BSI risk matrix
  // s=2: the business processes, ticked
  "2.2": { de: { x: 0.44, y: 0.69, scale: 2 }, en: { x: 0.44, y: 0.725, scale: 2 } },
  "5.1": both({ x: 0.44, y: 0.66, scale: 2.1 }), // s=3: the supplier list
  "12.3": both({ x: 0.44, y: 0.6, scale: 2 }), // s=1: the details that can change
  // s=2: the incident plan, written from the answers
  "3.1": { de: { x: 0.44, y: 0.68, scale: 2.2 }, en: { x: 0.44, y: 0.645, scale: 2.2 } },
  "3.3": both({ x: 0.445, y: 0.64, scale: 2 }), // s=1: the three reporting deadlines
  "2.3": both({ x: 0.45, y: 0.66, scale: 1.9 }), // s=4: the company's risks on the matrix
  "2.4": both({ x: 0.44, y: 0.66, scale: 2.2 }), // s=1: the security policy, written
  // s=2: what each contract covers
  "5.2": { de: { x: 0.44, y: 0.62, scale: 2.1 }, en: { x: 0.44, y: 0.6, scale: 2.1 } },
  // s=1: the accepted methods
  "9.1": { de: { x: 0.44, y: 0.68, scale: 2.1 }, en: { x: 0.44, y: 0.65, scale: 2.1 } },
  "10.1": both({ x: 0.44, y: 0.52, scale: 2.1 }), // s=1: the last working day, done right and wrong
  "11.1": both({ x: 0.44, y: 0.74, scale: 2.2 }), // s=2: the second factor per login
  "11.2": both({ x: 0.44, y: 0.69, scale: 2.1 }), // s=2: the tools, with suggestions from the list
  "6.3": both({ x: 0.44, y: 0.7, scale: 2.1 }), // s=3: where a vulnerability is reported
  "4.2": both({ x: 0.44, y: 0.75, scale: 2 }), // s=2: what must keep running, and how
  // s=3: the backup system and its last restore
  "4.4": { de: { x: 0.44, y: 0.68, scale: 2.2 }, en: { x: 0.44, y: 0.645, scale: 2.2 } },
  // s=2: the staff trainings
  "8.2": { de: { x: 0.44, y: 0.68, scale: 2.2 }, en: { x: 0.44, y: 0.645, scale: 2.2 } },
  // s=2: what the BSI gets every three years
  "12.4": { de: { x: 0.44, y: 0.66, scale: 2 }, en: { x: 0.44, y: 0.625, scale: 2 } },
  // s=5: management approves the documents
  "7.3": { de: { x: 0.44, y: 0.7, scale: 2 }, en: { x: 0.44, y: 0.62, scale: 2 } },
};

/**
 * The step's screenshot in the reader's language, every language but German showing the English
 * one; null for a step without one.
 */
export const itemShot = (
  code: string,
  locale: string,
  alt: string,
): PreviewImage | null => {
  const lang: Lang = locale === "de" ? "de" : "en";
  const focus = ITEM_SHOTS[code]?.[lang];
  return focus
    ? {
        ...SIZE,
        src: `/images/durchgang/items/${lang}-${itemKey(code)}.webp`,
        alt,
        focus,
      }
    : null;
};
