"use client";

import { Loader2 } from "lucide-react";
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
      result: "Ein Schritt nach dem anderen, in klarer Reihenfolge.",
    },
    team: {
      title: "Mehrere mit eigenen Rollen",
      reality: "Geschäftsführung, IT und Betrieb teilen sich die Aufgaben.",
      result: "Alle Schritte nach Rollen, Priorität und Freigabestand.",
    },
  },
  en: {
    question: "Who is implementing NIS 2 at your company?",
    lede: "This decides how we lay out the path. You can switch at any time.",
    solo: {
      title: "Mostly me",
      reality: "One person holds it together, maybe with some help.",
      result: "One step at a time, in a clear order.",
    },
    team: {
      title: "Several people, own roles",
      reality: "Management, IT and operations share the work.",
      result: "Every step by role, priority and sign-off state.",
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
    <div className="grid gap-3 sm:grid-cols-2">
      <ChoiceCard
        illustration={<SoloIllustration />}
        copy={copy.solo}
        pending={pending === "solo"}
        disabled={pending !== null}
        onSelect={() => onSelect("solo")}
      />
      <ChoiceCard
        illustration={<TeamIllustration />}
        copy={copy.team}
        pending={pending === "team"}
        disabled={pending !== null}
        onSelect={() => onSelect("team")}
      />
    </div>
  );
}

/** The question and its lede, for callers that render their own container. */
export function journeyModeCopy(locale: Locale) {
  return locale === "de" ? COPY.de : COPY.en;
}

function ChoiceCard({
  illustration,
  copy,
  pending,
  disabled,
  onSelect,
}: {
  illustration: React.ReactNode;
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
        "group flex flex-col rounded-lg border bg-card p-4 text-left transition-colors",
        "hover:border-primary hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && !pending && "opacity-50",
      )}
    >
      <div className="mb-3 flex h-20 items-center justify-center text-primary">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : illustration}
      </div>
      <h3 className="text-sm font-semibold">{copy.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.reality}</p>
      <p className="mt-2 border-t pt-2 text-xs leading-relaxed text-foreground">
        {copy.result}
      </p>
    </button>
  );
}

/**
 * One line, one live step. The illustrations carry the actual difference
 * between the two layouts, so they are drawn rather than iconified: a person
 * icon beside a group icon would say "one vs many", which is the input, not
 * the thing being chosen.
 */
function SoloIllustration() {
  return (
    <svg viewBox="0 0 66 78" className="h-full w-auto" fill="none" aria-hidden="true">
      {/* The nodes sit on the curve's endpoints, so the line reads as a path
          that winds rather than as a stack of dots with a stray squiggle. */}
      <path
        d="M20 13 C 40 13, 46 23, 46 39 C 46 55, 40 65, 20 65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        className="opacity-40"
      />
      <circle cx="20" cy="13" r="8" fill="currentColor" />
      <circle
        cx="46"
        cy="39"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-40"
      />
      <circle
        cx="20"
        cy="65"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-40"
      />
    </svg>
  );
}

/** Four role columns, each with its own queue. */
function TeamIllustration() {
  const columns = [
    { x: 4, rows: [0, 1, 2] },
    { x: 22, rows: [0, 1] },
    { x: 40, rows: [0, 1, 2] },
    { x: 58, rows: [0, 1] },
  ];
  return (
    <svg viewBox="0 0 74 78" className="h-full w-auto" fill="none" aria-hidden="true">
      {columns.map((column) => (
        <g key={column.x}>
          <rect
            x={column.x}
            y={4}
            width="12"
            height="3"
            rx="1.5"
            fill="currentColor"
            className="opacity-30"
          />
          {column.rows.map((row) => (
            <rect
              key={row}
              x={column.x}
              y={15 + row * 18}
              width="12"
              height="13"
              rx="2.5"
              fill={column.x === 4 && row === 0 ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              className={column.x === 4 && row === 0 ? "" : "opacity-35"}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
