import "@/lib/server-guard";

import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Typefaces for generated PDFs.
 *
 * Without this, @react-pdf falls back to the PDF base-14 Helvetica, which is
 * never embedded: every reader substitutes its own metrics, so the same file
 * looks different (and usually worse) on every machine. Embedding real TTFs
 * makes the output byte-identical everywhere and gives us weight control.
 *
 * The files are vendored under public/fonts rather than fetched from a CDN so
 * a self-hosted instance with no egress renders the same document we do. Both
 * families are SIL OFL 1.1; the licence texts ship next to the .ttf files.
 */
export const FONT = {
  sans: "Inter",
  mono: "IBM Plex Mono",
} as const;

const FONT_DIR = join(process.cwd(), "public", "fonts");

const SANS_WEIGHTS = [
  { file: "Inter-Regular.ttf", fontWeight: 400 },
  { file: "Inter-Medium.ttf", fontWeight: 500 },
  { file: "Inter-SemiBold.ttf", fontWeight: 600 },
  { file: "Inter-Bold.ttf", fontWeight: 700 },
] as const;

export function registerPdfFonts(): void {
  if (Font.getRegisteredFontFamilies().includes(FONT.sans)) return;

  Font.register({
    family: FONT.sans,
    fonts: SANS_WEIGHTS.map(({ file, fontWeight }) => ({
      src: join(FONT_DIR, file),
      fontWeight,
      fontStyle: "normal" as const,
    })),
  });

  Font.register({
    family: FONT.mono,
    src: join(FONT_DIR, "IBMPlexMono-Regular.ttf"),
  });

  // German compounds (Teilnahmebescheinigung, Geschäftsführerschulung) are the
  // longest words on the page and the default hyphenator splits them on
  // English patterns. Returning the word whole lets the layout wrap between
  // words instead of inventing hyphens no German reader would write.
  Font.registerHyphenationCallback((word) => [word]);
}
