"use client";

import { createContext, Fragment, useContext, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ItemView } from "./view";

const GlossContext = createContext<ItemView["gloss"]>({});

/** The item's glossed texts, for every <Glossed> below it. */
export const GlossProvider = GlossContext.Provider;

/**
 * A term explained in place, styled like the pricing page's panels. A mouse opens it by
 * hovering; a tap, a click or Enter toggles it, so it works on a phone and from the keyboard.
 * A popover rather than a tooltip, because tooltips do not open on touch.
 */
function Term({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          className="cursor-help underline decoration-foreground/40 decoration-dotted underline-offset-4 hover:decoration-foreground"
        >
          {term}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-72 max-w-[calc(100vw-2rem)] p-3 text-left text-sm leading-6"
      >
        {definition}
      </PopoverContent>
    </Popover>
  );
}

export function Glossed({ text }: { text: string }) {
  const chunks = useContext(GlossContext)[text];
  if (!chunks) return text;
  return chunks.map((c, i) =>
    "term" in c ? (
      // Chunks are positional and never reordered.
      // biome-ignore lint/suspicious/noArrayIndexKey: see above
      <Term key={i} term={c.term} definition={c.definition} />
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: see above
      <Fragment key={i}>{c.text}</Fragment>
    ),
  );
}
