"use client";

import { Loader2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyMode } from "./journey-mode";

type Locale = "en" | "de" | "nl";

const COPY = {
  de: {
    question: "Wer setzt NIS 2 bei Ihnen um?",
    lede: "Davon hängt ab, wie wir Ihnen den Weg zeigen. Sie können jederzeit umstellen.",
    solo: {
      title: "Im Wesentlichen ich",
      reality: "Eine Person hält alles zusammen, vielleicht mit etwas Hilfe.",
      result: "Geführter Weg: ein Schritt nach dem anderen, in klarer Reihenfolge.",
    },
    team: {
      title: "Mehrere Personen mit eigenen Rollen",
      reality: "Geschäftsführung, IT und Betrieb teilen sich die Aufgaben.",
      result: "Teamansicht: alle Schritte nach Rollen, Priorität und Freigabestand.",
    },
  },
  en: {
    question: "Who is implementing NIS 2 at your company?",
    lede: "This decides how we lay out the path. You can switch at any time.",
    solo: {
      title: "Mostly me",
      reality: "One person holds it together, maybe with some help.",
      result: "Guided path: one step at a time, in a clear order.",
    },
    team: {
      title: "Several people with their own roles",
      reality: "Management, IT and operations share the work.",
      result: "Team view: every step by role, priority and sign-off state.",
    },
  },
} as const;

/**
 * The one question that forks the journey layout. Presentation only: the
 * caller decides what selecting an answer does, so the design route can render
 * the identical question without a session behind it.
 *
 * It asks a fact the visitor knows without thinking (how many people do this
 * work here), not a preference about themselves. An earlier guided/manual fork
 * asked "how do you want to work" and was removed for the obvious reason: a
 * first-time user cannot answer it. Nobody picks the option framed as the
 * simple one either, which is why neither answer mentions experience.
 */
export function JourneyModeCards({
  locale,
  pending = null,
  onSelect,
}: {
  locale: Locale;
  pending?: JourneyMode | null;
  onSelect: (mode: JourneyMode) => void;
}) {
  const copy = locale === "de" ? COPY.de : COPY.en;

  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <h2 className="text-center text-xl font-semibold tracking-tight">
        {copy.question}
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">{copy.lede}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ChoiceCard
          sketch={<SoloSketch />}
          copy={copy.solo}
          pending={pending === "solo"}
          disabled={pending !== null}
          onSelect={() => onSelect("solo")}
        />
        <ChoiceCard
          sketch={<TeamSketch />}
          copy={copy.team}
          pending={pending === "team"}
          disabled={pending !== null}
          onSelect={() => onSelect("team")}
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  sketch,
  copy,
  pending,
  disabled,
  onSelect,
}: {
  sketch: React.ReactNode;
  copy: { title: string; reality: string; result: string };
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group flex flex-col rounded-xl border bg-card p-5 text-left transition-all",
        "hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && !pending && "opacity-50",
      )}
    >
      <div className="mb-4 flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        {sketch}
      </div>
      <h3 className="text-sm font-semibold">{copy.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{copy.reality}</p>
      <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
        {pending ? (
          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
        ) : (
          <span className="mt-0.5 shrink-0 text-primary">&rarr;</span>
        )}
        {copy.result}
      </p>
    </button>
  );
}

/** Step positions in the solo miniature: the same serpentine, scaled down. */
const SOLO_SKETCH_STEPS = [
  { id: "s1", offset: 0, live: true },
  { id: "s2", offset: 14, live: false },
  { id: "s3", offset: 22, live: false },
  { id: "s4", offset: 14, live: false },
  { id: "s5", offset: 0, live: false },
] as const;

/** Role columns in the team miniature, one entry per dot. */
const TEAM_SKETCH_COLUMNS = [
  { id: "management", rows: ["m1", "m2", "m3"] },
  { id: "security", rows: ["s1", "s2"] },
  { id: "it", rows: ["i1", "i2", "i3", "i4"] },
  { id: "operations", rows: ["o1", "o2"] },
] as const;

/** A miniature of the guided path: one winding line of steps. */
function SoloSketch() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <User className="mb-0.5 h-4 w-4 text-muted-foreground" />
      {SOLO_SKETCH_STEPS.map((step) => (
        <span
          key={step.id}
          style={{ transform: `translateX(${step.offset}px)` }}
          className={cn(
            "block h-2.5 w-2.5 rounded-full",
            step.live ? "bg-primary" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

/** A miniature of the team view: four role columns. */
function TeamSketch() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-2.5">
        {TEAM_SKETCH_COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col gap-1">
            {column.rows.map((row, index) => (
              <span
                key={row}
                className={cn(
                  "block h-2.5 w-2.5 rounded-sm",
                  index === 0 ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
