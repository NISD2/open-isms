"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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

/**
 * The zoom that brings `focus` to the middle of the frame. The middle is held far enough from the
 * edges that the scaled image still fills the frame, so no blank edge shows.
 */
const zoomTo = ({ x, y, scale }: NonNullable<PreviewImage["focus"]>) => {
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
  const [zoomed, setZoomed] = useState(false);
  const { focus } = image;

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={16}
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
