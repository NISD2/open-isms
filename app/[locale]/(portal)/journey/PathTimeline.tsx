"use client";

import { AlertTriangle, Check } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { journeyDisclaimer, journeyDisclaimerLabel } from "./disclaimer";
import { type JourneyLocale, journeyLocaleOf } from "./path-nodes";
import type { StageProgress } from "./solo-path";

const COPY: Record<
  JourneyLocale,
  { progress: string; recommended: string; done: string; deadlines: string }
> = {
  en: {
    progress: "Progress",
    recommended: "Recommended order",
    done: "Done",
    deadlines:
      "Our recommended order, derived from each requirement's priority. The law sets no deadline for implementing the individual measures. Two duties carry dates of their own: registration within three months under § 33 BSIG, and the reporting cascade under § 32 BSIG, which runs from the moment you become aware of a significant incident.",
  },
  de: {
    progress: "Fortschritt",
    recommended: "Empfohlene Reihenfolge",
    done: "Erledigt",
    deadlines:
      "Unsere empfohlene Reihenfolge, abgeleitet aus der Priorität jeder Anforderung. Für die Umsetzung der einzelnen Maßnahmen nennt das Gesetz keine Frist. Zwei Pflichten haben eigene Termine: die Registrierung binnen drei Monaten nach § 33 BSIG und die Meldekette nach § 32 BSIG, die ab Kenntnis eines erheblichen Vorfalls läuft.",
  },
  cs: {
    progress: "Postup",
    recommended: "Doporučené pořadí",
    done: "Hotovo",
    deadlines:
      "Naše doporučené pořadí, odvozené z priority každého požadavku. Lhůty stanoví zákon č. 264/2025 Sb.: službu ohlásíte NÚKIB nejpozději do 60 dnů ode dne, kdy splníte podmínky (§ 6 odst. 1). Zavádět bezpečnostní opatření a hlásit incidenty musíte začít nejpozději do 1 roku ode dne doručení rozhodnutí o registraci (§ 13 odst. 4, § 15 odst. 4). Hlášení incidentu běží od jeho zjištění: prvotní hlášení do 24 hodin, u incidentu s významným dopadem pak oznámení do 72 hodin (§ 16 odst. 1 a 3).",
  },
};

/**
 * The rail's footprint in the row, exported because SoloPath mirrors it on the
 * far side to keep the path centred.
 *
 * The docstring below says the rail "lives in the gutter a centred path leaves
 * empty", and that was the intent, but a plain flex row does not deliver it: a
 * 14rem rail plus the gap ate the left side and `mx-auto` then centred the path
 * on what remained, parking it ~128px right of the content centre. The steps
 * and the section dividers agreed with each other, so it read as the path
 * itself being lopsided rather than as the row being off-balance.
 */
export const RAIL_WIDTH = "w-56";

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
  /** The page language; the disclaimer has more languages than the rest of the journey. */
  locale: string;
}) {
  const copy = COPY[journeyLocaleOf(locale)];
  if (stages.length === 0) return null;

  return (
    <nav
      data-tour="journey-timeline"
      aria-label={copy.progress}
      // Pins below the bar, not level with it: the bar occupies 68px to about
      // 108px, so a rail sharing its offset slides underneath and loses its
      // first lines to it.
      className={cn("sticky top-[120px] hidden shrink-0 self-start lg:block", RAIL_WIDTH)}
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
            done={copy.done}
          />
        ))}
      </ol>

      <p className="mt-1 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {copy.recommended} <DueDisclaimer locale={locale} />
      </p>
    </nav>
  );
}

function StageStop({
  stage,
  state,
  last,
  done,
}: {
  stage: StageProgress;
  state: "done" | "here" | "ahead";
  last: boolean;
  /** The word for a cleared window. */
  done: string;
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
              {done}
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
 * requirement's priority, and a figure this prominent has to say so where it
 * is read rather than only at the foot of the page.
 *
 * "No statutory deadline" is true of the §30 measures and false of two steps
 * on the same path, so it is not said flatly: §33 BSIG gives registration
 * three months from coming into scope, and §32 BSIG runs 24h/72h/one month
 * from awareness of a significant incident. Verified against
 * gesetze-im-internet 16.09.2026.
 *
 * The Czech Act does set a deadline for the measures, so the Czech text says so: a provider has
 * to start implementing them, and reporting incidents, within one year of the registration
 * decision's delivery (§ 13 odst. 4, § 15 odst. 4), and has to notify its service within 60 days
 * (§ 6 odst. 1). Verified against e-Sbírka, version of 1 November 2025, on 15.10.2026.
 */
function DueDisclaimer({ locale }: { locale: string }) {
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
        <p>{COPY[journeyLocaleOf(locale)].deadlines}</p>
        <p>{journeyDisclaimer(locale)}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
