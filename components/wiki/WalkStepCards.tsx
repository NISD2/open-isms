"use client";

import { Eye } from "lucide-react";
import { Art } from "@/components/durchgang/Art";
import type { WalkStep } from "@/components/durchgang/view";
import { ImagePreview, type PreviewImage } from "@/components/shared/ImagePreview";

export interface WalkStepCard {
  readonly step: WalkStep;
  /** The step's screen with a made-up company, null for a step without one. */
  readonly shot: PreviewImage | null;
  /** What the card does for a screen reader: show the step. */
  readonly label: string;
}

/**
 * The walk's step cards as the locked walk home draws them: picture, area, headline and teaser.
 * A card with a screen is itself the one way to show it, on hover or a tap, with the eye telling a
 * phone user that a tap shows something (ui-design principles 14 and 21).
 */
export function WalkStepCards({ cards }: { cards: readonly WalkStepCard[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ step, shot, label }) => (
        <li
          key={step.code}
          className="relative flex items-center gap-3 rounded-2xl border bg-card p-3 pr-4 shadow-xs transition-colors hover:border-primary/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring sm:gap-4"
        >
          <div className="flex h-12 w-14 shrink-0 items-end justify-center sm:h-14 sm:w-16">
            <Art src={step.image} className="h-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{step.section}</p>
            <p className="text-sm font-semibold leading-snug">{step.headline}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {step.teaser}
            </p>
          </div>
          {shot && (
            <>
              <Eye aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <ImagePreview image={shot}>
                <button
                  type="button"
                  aria-label={label}
                  className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline-none"
                />
              </ImagePreview>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
