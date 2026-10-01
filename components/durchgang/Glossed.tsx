"use client";

import { createContext, Fragment, useContext, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ItemView } from "./view";

const GlossContext = createContext<ItemView["gloss"]>({});

/** The item's glossed texts, for every <Glossed> below it. */
export const GlossProvider = GlossContext.Provider;

/**
 * A text with its terms explained in place, styled like the pricing page's panels. A term opens
 * on hover and focus, and on a tap, so it works on a phone too.
 */
function Term({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          // Radix closes a tooltip on click; a tap has to toggle it instead.
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          className="cursor-help underline decoration-foreground/40 decoration-dotted underline-offset-4 hover:decoration-foreground"
        >
          {term}
        </button>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        className="w-72 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-3 text-left text-sm leading-6 text-popover-foreground shadow-lg [&_.fill-foreground]:invisible"
      >
        {definition}
      </TooltipContent>
    </Tooltip>
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
