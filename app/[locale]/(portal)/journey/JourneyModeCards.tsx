"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { JourneyMode } from "./journey-mode";

/**
 * This question is the first screen a new user sees, in every locale, so its
 * copy lives in `messages/guide/*.json` like the walkthrough it belongs to
 * rather than in a DE/EN object in this file. The rest of the journey is
 * still bilingual inline strings; that debt is real but it is not this
 * component's to carry, because this one is unavoidable on first login.
 */
export function useJourneyModeCopy() {
  const t = useTranslations("guide.journeyMode");
  return {
    question: t("question"),
    lede: t("lede"),
    solo: {
      title: t("solo.title"),
      reality: t("solo.reality"),
      result: t("solo.result"),
    },
    team: {
      title: t("team.title"),
      reality: t("team.reality"),
      result: t("team.result"),
    },
  };
}

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
  pending = null,
  onSelect,
}: {
  pending?: JourneyMode | null;
  onSelect: (mode: JourneyMode) => void;
}) {
  const copy = useJourneyModeCopy();

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
