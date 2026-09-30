import { cn } from "@/lib/utils";

/**
 * The BSI's risk matrix, read-only. Every value is copied from BSI-Standard 200-3 v1.0 (2017):
 * the frequency bands from Tabelle 8, the damage levels from Tabelle 9, and the cell assignment
 * from Abbildung 3 on page 27. Read off the PDF on 30.09.2026.
 *
 * The platform's own editor (`RiskMethodologyEditor`) does not match this yet: it labels the
 * second band "Möglich" and colours cells by likelihood times impact, which is not the 200-3
 * assignment. The build replaces that, it does not reuse it as is.
 */

type Level = "gering" | "mittel" | "hoch" | "sehr hoch";

const FREQUENCIES = [
  {
    label: "selten",
    description:
      "Ereignis könnte nach heutigem Kenntnisstand höchstens alle fünf Jahre eintreten.",
  },
  {
    label: "mittel",
    description: "Ereignis tritt einmal alle fünf Jahre bis einmal im Jahr ein.",
  },
  {
    label: "häufig",
    description: "Ereignis tritt einmal im Jahr bis einmal pro Monat ein.",
  },
  { label: "sehr häufig", description: "Ereignis tritt mehrmals im Monat ein." },
] as const;

/** Top row first, as in Abbildung 3. */
const IMPACTS = [
  "existenzbedrohend",
  "beträchtlich",
  "begrenzt",
  "vernachlässigbar",
] as const;

const MATRIX: Readonly<Record<(typeof IMPACTS)[number], readonly Level[]>> = {
  existenzbedrohend: ["mittel", "hoch", "sehr hoch", "sehr hoch"],
  beträchtlich: ["mittel", "mittel", "hoch", "sehr hoch"],
  begrenzt: ["gering", "gering", "mittel", "hoch"],
  vernachlässigbar: ["gering", "gering", "gering", "gering"],
};

/** One hue, light to dark: magnitude, not identity. The level is also written in every cell. */
const LEVEL_FILL: Readonly<Record<Level, string>> = {
  gering: "bg-primary/10",
  mittel: "bg-primary/30",
  hoch: "bg-primary/65",
  "sehr hoch": "bg-primary",
};

const LEVEL_INK: Readonly<Record<Level, string>> = {
  gering: "text-foreground",
  mittel: "text-foreground",
  hoch: "text-primary-foreground",
  "sehr hoch": "text-primary-foreground",
};

const LEVELS: readonly Level[] = ["gering", "mittel", "hoch", "sehr hoch"];

interface RiskMatrixProps {
  /** Fade every cell but one, to show how a single risk is read off the matrix. */
  readonly highlight?: { readonly impact: string; readonly frequency: string };
}

export function RiskMatrix({ highlight }: RiskMatrixProps) {
  const isLit = (impact: string, frequency: string) =>
    !highlight || (highlight.impact === impact && highlight.frequency === frequency);

  return (
    <figure className="space-y-5">
      <div className="grid grid-cols-[auto_1fr] gap-x-3">
        <div className="flex items-center">
          <span className="rotate-180 text-xs font-medium text-muted-foreground [writing-mode:vertical-rl]">
            Wie groß der Schaden wäre
          </span>
        </div>
        <div className="grid grid-cols-[minmax(5.75rem,auto)_repeat(4,minmax(0,1fr))] gap-1">
          {IMPACTS.map((impact) => (
            <div key={impact} className="contents">
              <span
                className={cn(
                  "flex items-center pr-2 text-xs font-medium",
                  highlight?.impact === impact
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {impact}
              </span>
              {MATRIX[impact].map((level, i) => {
                const frequency = FREQUENCIES[i].label;
                const lit = isLit(impact, frequency);
                return (
                  <span
                    key={frequency}
                    title={`${impact}, ${frequency}: ${level}`}
                    className={cn(
                      "flex h-14 items-center justify-center rounded-lg px-1 text-center text-xs font-semibold transition-opacity sm:h-[4.5rem] sm:text-sm",
                      LEVEL_FILL[level],
                      LEVEL_INK[level],
                      !lit && "opacity-20",
                      highlight &&
                        lit &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                    )}
                  >
                    {level}
                  </span>
                );
              })}
            </div>
          ))}
          <span />
          {FREQUENCIES.map((f) => (
            <div key={f.label} className="pt-2 text-center">
              <p
                className={cn(
                  "text-xs font-medium",
                  highlight?.frequency === f.label
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {f.label}
              </p>
              {!highlight && (
                <p className="mt-1 hidden text-[11px] leading-4 text-muted-foreground sm:block">
                  {f.description}
                </p>
              )}
            </div>
          ))}
          <span />
          <span className="col-span-4 pt-2 text-center text-xs font-medium text-muted-foreground">
            Wie oft es eintritt
          </span>
        </div>
      </div>

      {!highlight && (
        <>
          <ul
            className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
            aria-label="Legende"
          >
            {LEVELS.map((level) => (
              <li key={level} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-[4px]", LEVEL_FILL[level])} />
                {level}
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 text-xs sm:hidden">
            {FREQUENCIES.map((f) => (
              <div key={f.label}>
                <dt className="font-medium">{f.label}</dt>
                <dd className="text-muted-foreground">{f.description}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </figure>
  );
}
