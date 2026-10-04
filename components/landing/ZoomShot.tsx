"use client";

import Image from "next/image";
import { useRef } from "react";
import { type PreviewImage, zoomTo } from "@/components/shared/ImagePreview";
import { cn } from "@/lib/utils";
import { MotionToggle, useMotionAllowed, usePrefersStill } from "./motion";
import { useInView } from "./useInView";
import { useZoomLoop, ZOOM_EASE, ZOOM_MS } from "./useZoomLoop";

/** How long a screenshot takes to fade when another one takes its place. */
const FADE_MS = 500;

interface ShotProps {
  readonly image: PreviewImage;
  readonly sizes: string;
  readonly preload?: boolean;
  /** Transparent, in a stack where another screenshot is the one shown. */
  readonly faded?: boolean;
  /** Left out for screen readers, in a stack where another screenshot is the one shown. */
  readonly hidden?: boolean;
  readonly className?: string;
}

/**
 * A screenshot that glides into its focus point while `zoomed` and back out when not: the hover
 * preview's zoom (ImagePreview), played on the page. Only transform and opacity move, so the
 * compositor runs it, and a flip halfway turns the move around instead of jumping.
 */
export function ZoomImage({
  image,
  sizes,
  preload = false,
  faded = false,
  hidden = false,
  className,
  zoomed,
}: ShotProps & { readonly zoomed: boolean }) {
  const still = usePrefersStill();
  const { focus } = image;
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      preload={preload}
      aria-hidden={hidden || undefined}
      style={{
        ...(focus ? zoomTo(focus) : {}),
        ...(focus && zoomed ? {} : { transform: "none" }),
        opacity: faded ? 0 : 1,
        transition: still
          ? "none"
          : `transform ${ZOOM_MS}ms ${ZOOM_EASE}, opacity ${FADE_MS}ms ease-out`,
      }}
      className={cn("block h-auto w-full", className)}
    />
  );
}

/** A screenshot that zooms in and out on its own for as long as `running`. */
export function LoopingImage({
  running,
  ...props
}: ShotProps & { readonly running: boolean }) {
  const zoomed = useZoomLoop(running) !== null;
  return <ZoomImage {...props} zoomed={zoomed} />;
}

/**
 * A framed screenshot that zooms while it is on screen, with the pause switch in its corner:
 * the hero's, and each step's on a phone, where the steps stack instead of sharing one frame.
 */
export function AutoShot({ className, ...props }: Omit<ShotProps, "faded" | "hidden">) {
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame);
  const allowed = useMotionAllowed();
  return (
    <div ref={frame} className={cn("relative overflow-hidden bg-muted", className)}>
      <LoopingImage {...props} running={inView && allowed} />
      <MotionToggle className="absolute right-3 bottom-3" />
    </div>
  );
}
