"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface PreviewImage {
  readonly src: string;
  readonly alt: string;
  /** The file's size in pixels, which gives its aspect ratio. */
  readonly width: number;
  readonly height: number;
  /**
   * Where the preview zooms in once it is open, as fractions of the image's width and height,
   * and by how much, so the text there can be read.
   */
  readonly focus?: { readonly x: number; readonly y: number; readonly scale: number };
}

/** How wide the preview shows, in CSS pixels, before any zoom. */
const PREVIEW_WIDTH = 640;
/** Long enough to take in the whole image first, so the zoom reads as moving into it. */
const ZOOM_DELAY_MS = 950;
/** The gap to the trigger and the margin kept to the screen's edge, in CSS pixels. */
const OFFSET = 12;
const EDGE = 16;

/**
 * Beside the trigger where the preview fits on either side (the popover flips to the left on its
 * own), else under it: on a phone a full-width trigger leaves no room beside it, and the preview
 * would open off the screen.
 */
const sideFor = (trigger: HTMLElement | null): "right" | "bottom" => {
  if (!trigger) return "right";
  const { left, right } = trigger.getBoundingClientRect();
  const needed = Math.min(PREVIEW_WIDTH, window.innerWidth - 2 * EDGE) + OFFSET + EDGE;
  return window.innerWidth - right >= needed || left >= needed ? "right" : "bottom";
};

/**
 * The zoom that brings `focus` to the middle of the frame. The middle is held far enough from the
 * edges that the scaled image still fills the frame, so no blank edge shows.
 */
export const zoomTo = ({ x, y, scale }: NonNullable<PreviewImage["focus"]>) => {
  const edge = 0.5 / scale;
  const cx = Math.min(Math.max(x, edge), 1 - edge);
  const cy = Math.min(Math.max(y, edge), 1 - edge);
  return {
    transformOrigin: `${cx * 100}% ${cy * 100}%`,
    transform: `translate(${(0.5 - cx) * 100}%, ${(0.5 - cy) * 100}%) scale(${scale})`,
  };
};

/**
 * Every image shown on hover goes through here (Simon, 03.10.2026). It opens on hover with a
 * mouse and on a tap on touch, since a tooltip never opens on touch. It never holds the hover:
 * on a device with a mouse the image lets the pointer through, so it closes the moment the
 * pointer leaves the trigger, onto the image too. With a `focus` it then zooms into that point;
 * under reduced motion it opens already zoomed, without the movement.
 */
export function ImagePreview({
  image,
  children,
}: {
  image: PreviewImage;
  children: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("right");
  const [zoomed, setZoomed] = useState(false);
  const pointer = useRef("");
  const trigger = useRef<HTMLButtonElement>(null);
  const { focus } = image;

  const show = (next: boolean) => {
    if (next) setSide(sideFor(trigger.current));
    setOpen(next);
  };

  useEffect(() => {
    if (!open || !focus) {
      setZoomed(false);
      return;
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setZoomed(true), still ? 0 : ZOOM_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open, focus]);

  return (
    <Popover open={open} onOpenChange={show}>
      <PopoverTrigger
        ref={trigger}
        asChild
        onPointerEnter={(e) => e.pointerType === "mouse" && show(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && show(false)}
        onPointerDown={(e) => {
          pointer.current = e.pointerType;
        }}
        // With a mouse the hover owns the preview, so a click must not toggle it shut. A click from
        // the keyboard (detail 0) still toggles it.
        onClick={(e) => {
          if (e.detail > 0 && pointer.current === "mouse") e.preventDefault();
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        sideOffset={OFFSET}
        collisionPadding={EDGE}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-[min(40rem,calc(100vw-2rem))] overflow-hidden p-0 [@media(hover:hover)]:pointer-events-none"
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={`${Math.ceil(PREVIEW_WIDTH * (focus?.scale ?? 1))}px`}
          style={
            focus && {
              ...zoomTo(focus),
              ...(zoomed ? {} : { transform: "none" }),
            }
          }
          className="h-auto w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        />
      </PopoverContent>
    </Popover>
  );
}
