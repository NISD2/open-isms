"use client";

import { BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Small book icon shown on auto-translated wiki pages. The tooltip
 * reveals the source-language notice on hover. Hidden on the canonical
 * (source) locale view.
 */
export function TranslationBadge({ notice }: { notice: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={notice}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground/70 hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{notice}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
