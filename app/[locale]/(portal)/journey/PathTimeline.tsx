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
 * The vertical rail beside the path: where you are, and how long each stage
 * takes to work through.
 *
 * It answers the two questions a 49-step scroll otherwise leaves open — how
 * far through am I, and how long is this going to take — and it answers the
 * first continuously, because the stage it marks is the stage the pinned bar
 * is already tracking against your scroll position. Scrolling into a new stage
 * moves the dot.
 *
 * It tracks STAGES rather than the criticality bands, and that is the honest
 * choice rather than a compromise: stages run contiguously down the path so a
 * marker can follow them, while the bands are scattered through it by design
 * and a marker would jitter between them every second node. Criticality still
 * shows on the steps themselves, as the badge on the eight that come first.
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

  const totalMinutes = stages.reduce((sum, stage) => sum + stage.minutes, 0);

  return (
    <nav
      data-tour="journey-timeline"
      aria-label={de ? "Fortschritt" : "Progress"}
      // Pins below the bar, not level with it: the bar occupies 68px to about
      // 108px, so a rail sharing its offset slides underneath and loses its
      // first lines to it.
      className="sticky top-[120px] hidden w-52 shrink-0 self-start lg:block"
    >
      <ol>
        {stages.map((stage, i) => (
          <StageStop
            key={stage.index}
            stage={stage}
            state={
              stage.index === activeStage
                ? "here"
                : stage.done === stage.total
                  ? "done"
                  : "ahead"
            }
            last={i === stages.length - 1}
            de={de}
          />
        ))}
      </ol>

      <p className="mt-1 flex items-center gap-1.5 border-t pt-3 text-[11px] text-muted-foreground">
        {de ? "Zusammen etwa" : "About"} {durationLabel(totalMinutes, de)}
        <DurationDisclaimer locale={locale} />
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
          read as one line rather than as five separate markers. */}
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

      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
        <p
          className={cn(
            "text-sm leading-tight",
            state === "here" ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {stage.label}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums">
            {stage.done}/{stage.total}
          </span>
          {stage.done === stage.total ? (
            <Check className="h-3 w-3 text-primary" aria-hidden="true" />
          ) : (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{durationLabel(stage.minutes, de)}</span>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

/**
 * Working time, rounded the way someone would say it out loud. Minutes below
 * an hour, one decimal above, because "2.4 h" is a plan and "145 min" is a
 * measurement nobody made.
 */
function durationLabel(minutes: number, de: boolean): string {
  if (minutes <= 0) return de ? "kurz" : "short";
  if (minutes < 60) return de ? `${minutes} Min.` : `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  const text = de ? String(hours).replace(".", ",") : String(hours);
  return de ? `${text} Std.` : `${text} h`;
}

/**
 * These durations are the framework's own per-category estimates, and they
 * measure filling the platform in — not implementing the control in the
 * business, which scales with the company and has no single honest number
 * (§ 30 Abs. 1 S. 2). Saying so is the difference between a useful figure and
 * a misleading one, so it is one hover away wherever a duration appears.
 */
function DurationDisclaimer({ locale }: { locale: Locale }) {
  const de = locale === "de";
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={journeyDisclaimerLabel(locale)}
          className="inline-flex text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
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
            ? "Richtwerte für das Ausfüllen hier im Tool. Wie lange die Umsetzung im Betrieb dauert, hängt von Ihrer Größe und Ihren Systemen ab und ist damit nicht vorhersagbar."
            : "Guide values for filling this in here in the tool. How long implementing it in the business takes depends on your size and your systems, and cannot be predicted from here."}
        </p>
        <p>{journeyDisclaimer(locale)}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
