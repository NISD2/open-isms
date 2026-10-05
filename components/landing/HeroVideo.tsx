"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { MotionToggle, useMotionAllowed } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

/** Where the video plays: a wide screen, not on data saver, motion allowed. */
const WIDE = "(min-width: 1024px)";

const mayPlay = (): boolean => {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return (
    window.matchMedia(WIDE).matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    connection?.saveData !== true
  );
};

/**
 * The hero's image first, then the walk's video over it once the page has loaded and the video can
 * play through: fetched in the background at full quality, faded in on the same 16:9 box, so the
 * page loads as fast as with the image alone (Simon, 05.10.2026; Lighthouse desktop 99 to 100 with
 * and without it). Phones, data saver and reduced motion keep the image. The page's one pause
 * switch stops it too, with its button in the video's corner.
 */
export function HeroVideo({
  src,
  children,
}: {
  readonly src: string;
  readonly children: ReactNode;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [fetching, setFetching] = useState(false);
  const [ready, setReady] = useState(false);
  const allowed = useMotionAllowed();

  useEffect(() => {
    if (!mayPlay()) return;
    const start = () => setFetching(true);
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!ready || !el) return;
    if (allowed) void el.play();
    else el.pause();
  }, [ready, allowed]);

  return (
    <div className="relative">
      {children}
      {fetching && (
        <video
          ref={video}
          src={src}
          muted
          playsInline
          loop
          preload="auto"
          aria-hidden
          onCanPlayThrough={() => setReady(true)}
          className={cn(
            "absolute inset-0 size-full rounded-xl border border-border/60 bg-muted object-cover transition-opacity duration-700",
            ready ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      )}
      {ready && <MotionToggle className="absolute right-3 bottom-3" />}
    </div>
  );
}
