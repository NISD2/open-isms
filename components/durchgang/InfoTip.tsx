"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Help that only some need, next to what it helps with: an info sign that opens on hover with a
 * mouse and on a tap, a click or Enter. A popover rather than a tooltip, because tooltips do not
 * open on touch; the same behaviour as a term explained in place.
 */
export function InfoTip({ label, children }: { label: string; children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          // The sign stays 24 px; an invisible ring around it makes the tap target 44 px.
          className="relative inline-flex size-6 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground after:absolute after:-inset-2.5 hover:bg-muted hover:text-foreground"
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-80 max-w-[calc(100vw-2rem)] p-3 text-left text-sm leading-6"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
