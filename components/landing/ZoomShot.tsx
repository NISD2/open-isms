"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MotionToggle, useMotionAllowed, usePrefersStill } from "./motion";
import type { Focus, Shot } from "./shots";
import { useInView } from "./useInView";
import { useZoomLoop, ZOOM_EASE, ZOOM_MS } from "./useZoomLoop";

/** How long a screenshot takes to fade when another one takes its place. */
const FADE_MS = 500;

/**
 * The transform that brings `focus` to the middle of the frame, held far enough from the edges
 * that the scaled image still fills it. Measured from the top left corner rather than from the
 * focus (as the hover preview's zoomTo is), so gliding from one stop to the next is one move
 * instead of a jump when the origin changes.
 */
const glideTo = ({ x, y, scale }: Focus): string => {
  const edge = 0.5 / scale;
  const cx = Math.min(Math.max(x, edge), 1 - edge);
  const cy = Math.min(Math.max(y, edge), 1 - edge);
  return `translate(${(0.5 - scale * cx) * 100}%, ${(0.5 - scale * cy) * 100}%) scale(${scale})`;
};

interface ShotProps {
  readonly image: Shot;
  readonly sizes: string;
  readonly preload?: boolean;
  /** Transparent, in a stack where another screenshot is the one shown. */
  readonly faded?: boolean;
  /** Left out for screen readers, in a stack where another screenshot is the one shown. */
  readonly hidden?: boolean;
  readonly className?: string;
}

/**
 * A screenshot that glides to its stop number `stop` and back out to the whole screen at null:
 * the hover preview's zoom (ImagePreview), played on the page. Only transform and opacity move, so
 * the compositor runs it, and a change halfway turns the move around instead of jumping.
 */
export function ZoomImage({
  image,
  sizes,
  preload = false,
  faded = false,
  hidden = false,
  className,
  stop,
  onLoad,
}: ShotProps & { readonly stop: number | null; readonly onLoad?: () => void }) {
  const still = usePrefersStill();
  const focus = stop === null ? undefined : image.stops[stop];
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      onLoad={onLoad}
      preload={preload}
      fetchPriority={preload ? "high" : undefined}
      aria-hidden={hidden || undefined}
      style={{
        transformOrigin: "0 0",
        transform: focus ? glideTo(focus) : "none",
        opacity: faded ? 0 : 1,
        transition: still
          ? "none"
          : `transform ${ZOOM_MS}ms ${ZOOM_EASE}, opacity ${FADE_MS}ms ease-out`,
      }}
      className={cn("block h-auto w-full", className)}
    />
  );
}

/** A screenshot that visits its stops on its own for as long as `running`. */
export function LoopingImage({
  running,
  ...props
}: ShotProps & { readonly running: boolean }) {
  const { stop } = useZoomLoop(running, props.image.stops.length);
  return <ZoomImage {...props} stop={stop} />;
}

/**
 * Whether the browser holds the file it picks for `image` at `sizes`, fetched in the background
 * once `start`. An image given the same `sizes` then picks that file and shows it at once.
 */
function useFetched(image: Shot, sizes: string, start: boolean): boolean {
  const [fetched, setFetched] = useState(false);
  const { src, width, height } = image;
  useEffect(() => {
    if (!start) return;
    const { props } = getImageProps({ src, width, height, sizes, alt: "" });
    const file = new window.Image();
    file.fetchPriority = "low";
    file.sizes = sizes;
    file.srcset = props.srcSet ?? "";
    file.src = props.src;
    const done = () => setFetched(true);
    file.decode().then(done, done);
  }, [start, src, width, height, sizes]);
  return fetched;
}

/**
 * A framed screenshot that zooms while it is on screen, with the pause switch in its corner:
 * the hero's, and each step's on a phone, where the steps stack instead of sharing one frame.
 * After `rounds` rounds it rests whole, and its switch plays it again.
 *
 * With `restSizes` it first loads the smaller file the whole screen needs, so the page paints
 * sooner, then the zoom's file in the background, and zooms once that one is in. The sharp file
 * then replaces the first one at rest, never halfway through a zoom.
 */
export function AutoShot({
  className,
  rounds,
  restSizes,
  ...props
}: Omit<ShotProps, "faded" | "hidden"> & {
  readonly rounds?: number;
  readonly restSizes?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame);
  const allowed = useMotionAllowed();
  const [shown, setShown] = useState(false);
  const sharp = useFetched(props.image, props.sizes, restSizes !== undefined && shown);
  const zoomable = restSizes === undefined || sharp;
  const { stop, ended, replay } = useZoomLoop(
    inView && allowed && zoomable,
    props.image.stops.length,
    rounds,
  );
  return (
    <div ref={frame} className={cn("relative overflow-hidden bg-muted", className)}>
      <ZoomImage
        {...props}
        sizes={zoomable ? props.sizes : (restSizes ?? props.sizes)}
        onLoad={() => setShown(true)}
        stop={stop}
      />
      <MotionToggle
        className="absolute right-3 bottom-3"
        ended={ended}
        onReplay={replay}
      />
    </div>
  );
}
