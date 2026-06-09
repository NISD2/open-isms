"use client";

/**
 * Compliance progress bar — segmented + simple modes.
 *
 * Pre-translated approach: consumers pass an optional `label` prop
 * (e.g. "5 of 12 complete") that the component renders verbatim. The
 * percentage to the right is pure math, no translation needed. This
 * keeps the component decoupled from next-intl while letting both
 * apps render the same UI.
 *
 * Why no `t` function prop: t-functions can't cross the server/client
 * boundary cleanly, and this component is "use client" because of
 * the Tooltip + onClick scroll. Pre-translated strings sidestep the
 * issue.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nisd2/isms-ui/components/tooltip";
import { cn } from "@nisd2/isms-ui/lib/utils";
import {
  daysUntilDeadline,
  isRecurringFrequency,
  type Frequency,
} from "@nisd2/isms-lib/compliance/deadlines";

export interface RequirementSegment {
  code: string;
  status: string;
  frequency: string;
  nextReviewDate: string | null;
  /** Set when module-backed requirement has operational data ready to confirm */
  isSatisfiable?: boolean;
}

type SegmentedProps = {
  segments: RequirementSegment[];
  completed?: never;
  total?: never;
};
type SimpleProps = { completed: number; total: number; segments?: never };

export type ComplianceProgressProps = (SegmentedProps | SimpleProps) & {
  className?: string;
  /**
   * Pre-translated label shown on the left of the bar. Defaults to
   * `"{completed} of {total} complete"`. Pass a translated version if
   * the consumer wires up i18n.
   */
  label?: string;
};

type Urgency =
  | "done"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "not_started"
  | "in_progress"
  | "needs_review"
  | "rejected"
  | "satisfiable";

const SEGMENT_COLORS: Record<Urgency, string> = {
  done: "bg-emerald-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  orange: "bg-orange-500",
  red: "bg-red-500",
  not_started: "bg-gray-300 dark:bg-gray-600",
  in_progress: "bg-blue-400",
  needs_review: "bg-orange-400/60",
  rejected: "bg-red-500/70",
  satisfiable: "bg-blue-400/70",
};

function isDone(status: string): boolean {
  return (
    status === "completed" ||
    status === "approved" ||
    status === "not_applicable"
  );
}

function getSegmentUrgency(seg: RequirementSegment): Urgency {
  if (!isDone(seg.status)) {
    if (seg.isSatisfiable) return "satisfiable";
    if (seg.status === "in_progress") return "in_progress";
    if (seg.status === "needs_review") return "needs_review";
    if (seg.status === "rejected") return "rejected";
    return "not_started";
  }
  if (!seg.nextReviewDate || !isRecurringFrequency(seg.frequency as Frequency))
    return "done";

  const days = daysUntilDeadline(new Date(seg.nextReviewDate));
  if (days <= 0) return "red";
  if (days <= 7) return "orange";
  if (days <= 31) return "yellow";
  return "green";
}

export function ComplianceProgress(props: ComplianceProgressProps) {
  const { className, label } = props;

  const segments = props.segments ?? null;
  const total: number = segments ? segments.length : (props.total ?? 0);
  const completed: number = segments
    ? segments.filter((s) => isDone(s.status)).length
    : (props.completed ?? 0);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const resolvedLabel = label ?? `${completed} of ${total} complete`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{resolvedLabel}</span>
          <span
            className={cn(
              "font-medium tabular-nums",
              percentage === 100
                ? "text-emerald-600 dark:text-emerald-400"
                : percentage < 50
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400",
            )}
          >
            {percentage}%
          </span>
        </div>
        <div className="flex h-2 w-full gap-px rounded-full overflow-hidden bg-muted">
          {segments ? (
            segments.map((seg, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(seg.code);
                      if (!el) return;
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className={cn(
                      "h-full cursor-pointer transition-all duration-500 hover:opacity-80",
                      SEGMENT_COLORS[getSegmentUrgency(seg)],
                    )}
                    style={{ width: `${100 / total}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs font-mono">{seg.code}</p>
                </TooltipContent>
              </Tooltip>
            ))
          ) : (
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
