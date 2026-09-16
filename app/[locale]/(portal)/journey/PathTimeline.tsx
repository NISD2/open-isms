"use client";

import { AlertTriangle, Check } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { journeyDisclaimer, journeyDisclaimerLabel } from "./disclaimer";
import type { StageProgress } from "./solo-path";

type Locale = "en" | "de" | "nl";

/**
 * The vertical rail beside the path: the three deadline windows, and which one
 * you are reading.
 *
 * Now that the path itself runs in deadline order, the rail is simply its
 * table of contents — and a real timeline, because the windows are in time
 * order and scrolling walks them. It needs no per-stage horizon label: the
 * stage name IS the horizon.
 *
 * It marks position continuously, because the stage it highlights is the one
 * the pinned bar is already tracking against your scroll.
 *
 * Desktop only. It lives in the gutter a centred path leaves empty, which is
 * space that exists only there; narrower screens keep the stage in the pinned
 * bar and the badges on the steps.
 */
export function PathTimeline({
  stages,
  activeStage,
  locale,
}: {
  stages: StageProgress[];
  /** 1-based stage the reader is currently scrolled into. */
  activeStage: number;
  locale: Locale;
}) {
  const de = locale === "de";
  if (stages.length === 0) return null;

  return (
    <nav
      data-tour="journey-timeline"
      aria-label={de ? "Fortschritt" : "Progress"}
      // Pins below the bar, not level with it: the bar occupies 68px to about
      // 108px, so a rail sharing its offset slides underneath and loses its
      // first lines to it.
      className="sticky top-[120px] hidden w-56 shrink-0 self-start lg:block"
    >
      <ol>
        {stages.map((stage, i) => (
          <StageStop
            key={stage.index}
            stage={stage}
            state={
              stage.index === activeStage ? "here" : stage.open === 0 ? "done" : "ahead"
            }
            last={i === stages.length - 1}
            de={de}
          />
        ))}
      </ol>

      <p className="mt-1 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {de ? "Empfohlene Reihenfolge" : "Recommended order"}{" "}
        <DueDisclaimer locale={locale} />
      </p>
    </nav>
  );
}

function StageStop({
  stage,
  state,
  last,
  de,
}: {
  stage: StageProgress;
  state: "done" | "here" | "ahead";
  last: boolean;
  de: boolean;
}) {
  return (
    <li className="flex gap-3">
      {/* Dot over a connector that runs the height of the row, so the stops
          read as one line rather than as three separate markers. */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full",
            state === "here"
              ? "bg-primary ring-4 ring-primary/20"
              : state === "done"
                ? "bg-primary"
                : "border-2 border-border bg-background",
          )}
        />
        {last ? null : <span className="w-px flex-1 bg-border" />}
      </div>

      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-6")}>
        <p
          className={cn(
            "text-sm leading-tight",
            state === "here" ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {stage.label}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {stage.open === 0 ? (
            <>
              <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
              {de ? "Erledigt" : "Done"}
            </>
          ) : (
            <span className="tabular-nums">
              {stage.done}/{stage.total}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

/**
 * These horizons are the platform's recommended sequencing, derived from each
 * requirement's priority. They are not statutory deadlines — NIS 2 sets no
 * per-control date — so a figure this prominent has to say so where it is
 * read, not only at the foot of the page.
 */
function DueDisclaimer({ locale }: { locale: Locale }) {
  const de = locale === "de";
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={journeyDisclaimerLabel(locale)}
          className="inline-flex translate-y-0.5 text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
        >
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-80 space-y-2 text-xs leading-relaxed text-muted-foreground"
      >
        <p>
          {de
            ? "Unsere empfohlene Reihenfolge, abgeleitet aus der Priorität jeder Anforderung. Das Gesetz nennt für die einzelnen Maßnahmen keine Fristen."
            : "Our recommended order, derived from each requirement's priority. The law sets no deadline for the individual controls."}
        </p>
        <p>{journeyDisclaimer(locale)}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
