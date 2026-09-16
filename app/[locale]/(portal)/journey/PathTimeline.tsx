"use client";

import { AlertTriangle, Check } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { journeyDisclaimer, journeyDisclaimerLabel } from "./disclaimer";
import type { Horizon, StageProgress } from "./solo-path";

type Locale = "en" | "de" | "nl";

/**
 * The vertical rail beside the path: where you are on it, and what is soon.
 *
 * It answers the two questions a 49-step scroll otherwise leaves open — how
 * far through am I, and how much of this is urgent — and it answers the first
 * one continuously, because the stage it marks is the stage the pinned bar is
 * already tracking against your scroll position. Scrolling into a new stage
 * moves the dot.
 *
 * It tracks STAGES rather than the time horizons, and that is not a
 * compromise: the stages run contiguously down the path, so a marker can walk
 * them honestly, while the horizons are scattered through it by design and a
 * marker would jitter between them. The horizon gets stated once, at the top,
 * where it reads as a fact rather than a position.
 *
 * Desktop only. It lives in the empty gutter beside a centred path, which is
 * space that exists only there; below that width the pinned bar still names
 * the stage and the steps still carry their "first" badges.
 */
export function PathTimeline({
  stages,
  activeStage,
  near,
  locale,
}: {
  stages: StageProgress[];
  /** 1-based stage the reader is currently scrolled into. */
  activeStage: number;
  /** The nearest time horizon, or null when the path has none. */
  near: Horizon | null;
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
      className="sticky top-[120px] hidden w-52 shrink-0 self-start lg:block"
    >
      {near ? <NearHorizon horizon={near} locale={locale} /> : null}

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
          />
        ))}
      </ol>
    </nav>
  );
}

/**
 * The one time statement. Stated once and near the top because it is the
 * answer to "how soon is this", which does not change as you scroll.
 */
function NearHorizon({ horizon, locale }: { horizon: Horizon; locale: Locale }) {
  const pct = horizon.total > 0 ? Math.round((horizon.done / horizon.total) * 100) : 0;

  return (
    <div className="mb-5 border-b pb-5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {horizon.phase}
        </p>
        <DisclaimerHint locale={locale} />
      </div>
      <p className="mt-0.5 text-sm font-semibold leading-tight">{horizon.label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {horizon.done}/{horizon.total}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {horizon.hint}.
      </p>
    </div>
  );
}

function StageStop({
  stage,
  state,
  last,
}: {
  stage: StageProgress;
  state: "done" | "here" | "ahead";
  last: boolean;
}) {
  return (
    <li className="flex gap-3">
      {/* Dot over a connector that runs the height of the row, so the stops
          read as one line rather than as five separate markers. */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-1 flex size-2.5 shrink-0 items-center justify-center rounded-full",
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
        <p className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
          {stage.done === stage.total ? (
            <Check className="h-3 w-3 text-primary" aria-hidden="true" />
          ) : null}
          {stage.done}/{stage.total}
        </p>
      </div>
    </li>
  );
}

/**
 * The horizon is the platform's recommended sequencing, not a statutory
 * deadline, and a figure this prominent has to say so where it is read rather
 * than only at the foot of the page.
 */
function DisclaimerHint({ locale }: { locale: Locale }) {
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
        className="w-80 text-xs leading-relaxed text-muted-foreground"
      >
        {journeyDisclaimer(locale)}
      </HoverCardContent>
    </HoverCard>
  );
}
