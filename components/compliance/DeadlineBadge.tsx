"use client";

import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { daysUntilDeadline, isRecurringFrequency } from "@/lib/compliance/deadlines";
import type { Frequency } from "@/lib/compliance/deadlines";

interface DeadlineBadgeProps {
  nextReviewDate: string | null;
  frequency: string;
}

const URGENCY_COLORS = {
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  yellow: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
} as const;

function getColorBand(days: number): keyof typeof URGENCY_COLORS {
  if (days <= 0) return "red";
  if (days <= 7) return "orange";
  if (days <= 30) return "yellow";
  return "green";
}

export function DeadlineBadge({ nextReviewDate, frequency }: DeadlineBadgeProps) {
  const t = useTranslations("compliance");

  if (!nextReviewDate || !isRecurringFrequency(frequency as Frequency)) {
    return null;
  }

  const deadline = new Date(nextReviewDate);
  const days = daysUntilDeadline(deadline);
  const color = getColorBand(days);

  const short = days < 0 ? `-${Math.abs(days)}d` : days === 0 ? t("deadline.dueToday") : `${days}d`;

  let tooltip: string;
  if (days < 0) {
    tooltip = t("deadline.overdue", { days: Math.abs(days) });
  } else if (days === 0) {
    tooltip = t("deadline.dueToday");
  } else {
    tooltip = t("deadline.dueIn", { days });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium tabular-nums ${URGENCY_COLORS[color]}`}
        >
          {short}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
