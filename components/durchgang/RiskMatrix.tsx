"use client";

import { useTranslations } from "next-intl";
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
}: {
  locale: "de" | "en";
  highlight?: { readonly frequency: Frequency; readonly impact: Impact };
  counts?: (frequency: Frequency, impact: Impact) => number;
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
                return (
                  <span
                    key={frequency}
                    title={`${IMPACT_TEXT[locale][impact].label}, ${FREQUENCY_TEXT[locale][frequency].label}: ${label}${counts ? `, ${t("count", { count })}` : ""}`}
                    className={cn(
                      "flex h-14 items-center justify-center rounded-lg px-0.5 text-center text-[11px] leading-tight font-semibold transition-opacity sm:h-[4.5rem] sm:px-1 sm:text-sm",
                      LEVEL_FILL[level],
                      !on && "opacity-20",
                      (highlight || counts) &&
                        on &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                    )}
                  >
                    {count > 0 ? (
                      <span className="flex flex-col items-center">
                        <span className="text-lg leading-none tabular-nums sm:text-2xl">
                          {count}
                        </span>
                        <span className="mt-1 text-[10px] font-medium sm:text-xs">
                          {label}
                        </span>
                      </span>
                    ) : (
                      label
                    )}
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
