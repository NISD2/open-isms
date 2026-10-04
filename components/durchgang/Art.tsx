import { cn } from "@/lib/utils";

/** The art of the walk's setup step, setting up the company; it has no item code to look it up by. */
export const SETUP_ART = "/images/durchgang/unternehmen.svg";

/** The step art carries its own white ground; multiply lets the tinted panel show through it. */
export function Art({ src, className }: { src: string | null; className: string }) {
  if (!src) return null;
  return (
    // biome-ignore lint/performance/noImgElement: animated SVG, next/image would rasterise it
    <img
      src={src}
      alt=""
      className={cn("w-auto mix-blend-multiply dark:mix-blend-normal", className)}
    />
  );
}

/** A card thumbnail. Items whose art is not drawn yet get no frame, rather than an empty tile. */
export function ArtThumb({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <div className="flex size-20 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-primary/[0.06]">
      <Art src={src} className="h-16" />
    </div>
  );
}
