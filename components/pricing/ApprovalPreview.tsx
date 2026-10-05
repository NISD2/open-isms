// A client component so the preview trigger is made on the client (see components/wiki/WalkHow.tsx).
"use client";

import { Eye } from "lucide-react";
import { ImagePreview, type PreviewImage } from "@/components/shared/ImagePreview";

/** The approval screen of the walk, behind a "So sieht Ihre Freigabe aus" trigger. */
export function ApprovalPreview({ shot, label }: { shot: PreviewImage; label: string }) {
  return (
    <ImagePreview image={shot}>
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline print:hidden"
      >
        <Eye aria-hidden className="size-4" />
        {label}
      </button>
    </ImagePreview>
  );
}
