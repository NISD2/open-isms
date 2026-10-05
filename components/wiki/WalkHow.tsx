// A client component so the preview triggers are made on the client: passed down from the server,
// a long page's payload can hand them to the popover as a lazy reference, which its slot rejects.
"use client";

import { ArrowRight, Check, Eye } from "lucide-react";
import Image from "next/image";
import { SignInLink } from "@/components/auth/SignInLink";
import { ImagePreview, type PreviewImage } from "@/components/shared/ImagePreview";

/** The thumbnail's width beside the points on a large screen, in CSS pixels. */
const THUMB_PX = 440;

/**
 * How the walk on nisd2.eu does the step a wiki page explains: what it asks and what it leaves
 * the company with, the step's own screen (from a made-up demo company) beside it on a large
 * screen and behind "So sieht es aus" everywhere, zooming in on the point that matters, and one
 * quiet way into registration worded as the next step of the topic. Points are paragraphs, not
 * list items: GlossedProse glosses everything inside an <li>.
 */
export function WalkHow({
  heading,
  lead,
  points,
  shot,
  seeIt,
  next,
}: {
  heading: string;
  lead: string;
  points: readonly string[];
  shot: PreviewImage;
  /** The trigger's label, "So sieht es aus". */
  seeIt: string;
  /** The link into registration, as the topic's next step. */
  next: string;
}) {
  return (
    <section className="grid gap-8 rounded-2xl border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,27.5rem)] lg:items-center">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {lead}
        </p>
        <div className="space-y-2.5">
          {points.map((point) => (
            <p
              key={point}
              className="flex max-w-[62ch] items-start gap-2.5 text-sm leading-relaxed"
            >
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{point}</span>
            </p>
          ))}
        </div>
        <div className="flex flex-col items-start gap-x-6 gap-y-1 pt-2 sm:flex-row sm:items-center print:hidden">
          <ImagePreview image={shot}>
            <button
              type="button"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              <Eye aria-hidden className="size-4" />
              {seeIt}
            </button>
          </ImagePreview>
          <SignInLink
            query={{ mode: "register" }}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {next}
            <ArrowRight aria-hidden className="size-4" />
          </SignInLink>
        </div>
      </div>
      <ImagePreview image={shot}>
        <button
          type="button"
          aria-label={seeIt}
          className="hidden cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md lg:block print:hidden"
        >
          <Image
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            sizes={`${THUMB_PX}px`}
            className="h-auto w-full"
          />
        </button>
      </ImagePreview>
    </section>
  );
}
