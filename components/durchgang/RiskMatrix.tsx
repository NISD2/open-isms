"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import {
  FREQUENCIES,
  FREQUENCY_TEXT,
  type Frequency,
  IMPACT_TEXT,
  IMPACTS,
  type Impact,
  RISK_LEVEL_TEXT,
  RISK_LEVELS,
  type RiskLevel,
  riskLevel,
} from "@/lib/compliance/bsi-200-3";
import type { WalkLocale } from "@/lib/durchgang";
import { cn } from "@/lib/utils";

/** One hue, light to dark: magnitude, not identity. The level is also written in every cell. */
export const LEVEL_FILL: Readonly<Record<RiskLevel, string>> = {
  low: "bg-primary/10 text-foreground",
  medium: "bg-primary/30 text-foreground",
  high: "bg-primary/65 text-primary-foreground",
  very_high: "bg-primary text-primary-foreground",
};

/** Top row first, as in Abbildung 3. */
const ROWS: readonly Impact[] = [...IMPACTS].reverse();

/** The picker's fields in reading order: top row first, rare to very frequent. */
const CELLS = ROWS.flatMap((impact) =>
  FREQUENCIES.map((frequency) => ({ frequency, impact })),
);

/**
 * The matrix small enough for one row of a list: sixteen fields to pick from, more often to the
 * right, more damage further up, each in its level's colour. The picked field stays lit; the
 * others fade once one is picked. The fields are native radio buttons of one group per row, so
 * the arrow keys move the pick and a row is one tab stop; each names its two steps and its level
 * for a screen reader and on hover.
 */
export function RiskPicker({
  locale,
  name,
  value,
  onPick,
}: {
  locale: WalkLocale;
  /** What is being rated, the group's name. */
  name: string;
  value: { readonly frequency?: Frequency; readonly impact?: Impact };
  onPick: (frequency: Frequency, impact: Impact) => void;
}) {
  const t = useTranslations("durchgang.ui.matrix");
  const group = useId();
  const picked = value.frequency !== undefined && value.impact !== undefined;
  return (
    <div className="flex items-stretch gap-1">
      <span className="flex rotate-180 items-center text-[10px] text-muted-foreground [writing-mode:vertical-rl]">
        {t("damageAxis")}
      </span>
      <div>
        <fieldset className="grid grid-cols-4 gap-0.5">
          <legend className="sr-only">{name}</legend>
          {CELLS.map(({ frequency, impact }) => {
            const level = riskLevel(frequency, impact);
            const on = value.frequency === frequency && value.impact === impact;
            const label = `${IMPACT_TEXT[locale][impact].label}, ${FREQUENCY_TEXT[locale][frequency].label}: ${RISK_LEVEL_TEXT[locale][level].label}`;
            return (
              <label
                key={`${impact}:${frequency}`}
                title={label}
                className={cn(
                  "relative size-7 rounded-[5px] transition-[opacity,box-shadow] hover:opacity-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-foreground",
                  LEVEL_FILL[level],
                  picked && !on && "opacity-35",
                  on && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
                )}
              >
                <input
                  type="radio"
                  name={group}
                  className="absolute inset-0 m-0 cursor-pointer appearance-none opacity-0"
                  aria-label={label}
                  checked={on}
                  onChange={() => onPick(frequency, impact)}
                />
              </label>
            );
          })}
        </fieldset>
        <p className="mt-0.5 text-center text-[10px] text-muted-foreground">
          {t("oftenAxis")}
        </p>
      </div>
    </div>
  );
}

/** A cell's level, with how many of the company's risks sit in it when there are any. */
function CellBody({ count, label }: { count: number; label: string }) {
  if (count === 0) return label;
  return (
    <span className="flex flex-col items-center">
      <span className="text-lg leading-none tabular-nums sm:text-2xl">{count}</span>
      <span className="mt-1 text-[10px] font-medium sm:text-xs">{label}</span>
    </span>
  );
}

/**
 * The BSI's risk matrix, read-only, straight from lib/compliance/bsi-200-3 (Tabellen 8 and 9,
 * Abbildung 3). With `highlight`, every cell but one fades, to show how one risk is read off it.
 * With `counts`, each cell shows how many of the company's own risks sit in it, and empty cells
 * fade, so the company's picture reads at a glance.
 */
export function RiskMatrix({
  locale,
  highlight,
  counts,
  onCell,
}: {
  locale: WalkLocale;
  highlight?: { readonly frequency: Frequency; readonly impact: Impact };
  counts?: (frequency: Frequency, impact: Impact) => number;
  /** Opens what sits in a cell; only cells that hold something become buttons. */
  onCell?: (frequency: Frequency, impact: Impact) => void;
}) {
  const t = useTranslations("durchgang.ui.matrix");
  const lit = (f: Frequency, i: Impact) =>
    (!highlight || (highlight.frequency === f && highlight.impact === i)) &&
    (!counts || counts(f, i) > 0);

  return (
    <figure className="space-y-5">
      <div className="grid grid-cols-[auto_1fr] gap-x-3">
        <div className="flex items-center">
          <span className="rotate-180 text-xs font-medium text-muted-foreground [writing-mode:vertical-rl]">
            {t("impact")}
          </span>
        </div>
        <div className="grid grid-cols-[4.5rem_repeat(4,minmax(0,1fr))] gap-1 sm:grid-cols-[7rem_repeat(4,minmax(0,1fr))]">
          {ROWS.map((impact) => (
            <div key={impact} className="contents">
              <span
                className={cn(
                  "flex min-w-0 items-center pr-1 text-[11px] font-medium break-words hyphens-auto sm:pr-2 sm:text-xs",
                  highlight?.impact === impact
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {IMPACT_TEXT[locale][impact].label}
              </span>
              {FREQUENCIES.map((frequency) => {
                const level = riskLevel(frequency, impact);
                const on = lit(frequency, impact);
                const count = counts?.(frequency, impact) ?? 0;
                const label = RISK_LEVEL_TEXT[locale][level].label;
                const title = `${IMPACT_TEXT[locale][impact].label}, ${FREQUENCY_TEXT[locale][frequency].label}: ${label}${counts ? `, ${t("count", { count })}` : ""}`;
                const className = cn(
                  "flex h-14 items-center justify-center rounded-lg px-0.5 text-center text-[11px] leading-tight font-semibold transition-opacity sm:h-[4.5rem] sm:px-1 sm:text-sm",
                  LEVEL_FILL[level],
                  !on && "opacity-20",
                  (highlight || counts) &&
                    on &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                );
                return onCell && count > 0 ? (
                  <button
                    key={frequency}
                    type="button"
                    title={title}
                    onClick={() => onCell(frequency, impact)}
                    className={cn(
                      className,
                      "cursor-pointer hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground",
                    )}
                  >
                    <CellBody count={count} label={label} />
                  </button>
                ) : (
                  <span key={frequency} title={title} className={className}>
                    <CellBody count={count} label={label} />
                  </span>
                );
              })}
            </div>
          ))}
          <span />
          {FREQUENCIES.map((frequency) => (
            <div key={frequency} className="pt-2 text-center">
              <p
                className={cn(
                  "text-xs font-medium",
                  highlight?.frequency === frequency
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {FREQUENCY_TEXT[locale][frequency].label}
              </p>
              {!highlight && (
                <p className="mt-1 hidden text-[11px] leading-4 text-muted-foreground sm:block">
                  {FREQUENCY_TEXT[locale][frequency].description}
                </p>
              )}
            </div>
          ))}
          <span />
          <span className="col-span-4 pt-2 text-center text-xs font-medium text-muted-foreground">
            {t("frequency")}
          </span>
        </div>
      </div>

      {!highlight && (
        <ul
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
          aria-label={t("legend")}
        >
          {RISK_LEVELS.map((level) => (
            <li key={level} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-[4px]", LEVEL_FILL[level])} />
              {RISK_LEVEL_TEXT[locale][level].label}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
