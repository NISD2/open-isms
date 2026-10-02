"use client";

import { Eye, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ImagePreview, type PreviewImage } from "@/components/shared/ImagePreview";

/** The screenshots: the app at 1600×900, captured at twice the size, one per language. */
const SHOT_SIZE = { width: 3200, height: 1800 } as const;

/**
 * Each promise's screenshot in `public/images/durchgang/promises/` and the point its preview
 * zooms into, as fractions of the image: the path's green ticks, the matrix, the sheet's reasons,
 * the document and the approve button.
 */
const SHOTS: Readonly<Partial<Record<number, Omit<PreviewImage, "src" | "alt">>>> = {
  1: { ...SHOT_SIZE, focus: { x: 0.84, y: 0.3, scale: 2.4 } },
  2: { ...SHOT_SIZE, focus: { x: 0.445, y: 0.6, scale: 2 } },
  3: { ...SHOT_SIZE, focus: { x: 0.86, y: 0.33, scale: 2.4 } },
  4: { ...SHOT_SIZE, focus: { x: 0.445, y: 0.6, scale: 2 } },
};

/**
 * One promise of the walk on its front door, with a screenshot of how the walk keeps it (Simon,
 * 03.10.2026). The card says "So sieht es aus" so a phone user knows a tap opens it.
 */
export function PromiseCard({
  icon: Icon,
  title,
  text,
  shot,
}: {
  icon: LucideIcon | undefined;
  title: string;
  text: string;
  shot: number;
}) {
  const t = useTranslations("durchgang.ui.intro");
  const locale = useLocale() === "de" ? "de" : "en";
  const size = SHOTS[shot];
  const card = (
    <button
      type="button"
      className="flex h-full w-full cursor-pointer flex-col rounded-2xl border bg-card p-5 text-left shadow-xs transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {Icon && (
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
          <Icon className="size-[1.125rem]" />
        </span>
      )}
      <span className="mt-3 font-semibold">{title}</span>
      <span className="mt-1 text-sm leading-6 text-muted-foreground">{text}</span>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-medium text-primary">
        <Eye className="size-3.5" />
        {t("example")}
      </span>
    </button>
  );
  return (
    <li>
      {size ? (
        <ImagePreview
          image={{
            ...size,
            src: `/images/durchgang/promises/${locale}-${shot}.webp`,
            alt: title,
          }}
        >
          {card}
        </ImagePreview>
      ) : (
        card
      )}
    </li>
  );
}
