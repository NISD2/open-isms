import { Check, CheckCheck, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DotState } from "./path-nodes";

/** A requirement's state on the journey's rail, as one dot. */
export function Dot({
  state,
  current,
  size = "md",
}: {
  state: DotState;
  current: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const glyph = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const inner = size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5";

  const cls =
    state === "signed"
      ? "border-primary bg-primary text-primary-foreground"
      : state === "na"
        ? "border-muted-foreground/30 bg-muted text-muted-foreground"
        : state === "awaiting"
          ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          : state === "rejected"
            ? "border-destructive bg-destructive/10 text-destructive"
            : current
              ? "border-primary bg-background text-primary"
              : state === "started"
                ? "border-primary/60 bg-background"
                : "border-border bg-background";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border",
        box,
        cls,
        current && "ring-2 ring-primary/40",
      )}
    >
      {state === "signed" ? (
        <CheckCheck className={glyph} />
      ) : state === "awaiting" ? (
        <Check className={glyph} />
      ) : state === "na" ? (
        <Minus className={glyph} />
      ) : state === "rejected" ? (
        <span className="text-[10px] font-bold leading-none">!</span>
      ) : (
        <span
          className={cn(
            "rounded-full",
            inner,
            current || state === "started" ? "bg-primary" : "bg-muted-foreground/40",
          )}
        />
      )}
    </div>
  );
}
