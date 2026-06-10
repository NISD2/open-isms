"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FrameworkBadges() {
  const t = useTranslations("landing");

  const badges = [
    { key: "nis2", color: "blue" },
    { key: "bsig", color: "emerald" },
    { key: "cir", color: "violet" },
  ] as const;

  const colorMap = {
    blue: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      info: "text-blue-400",
    },
    emerald: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      info: "text-emerald-400",
    },
    violet: {
      border: "border-violet-500/20",
      bg: "bg-violet-500/5",
      text: "text-violet-600 dark:text-violet-400",
      dot: "bg-violet-500",
      info: "text-violet-400",
    },
  } as const;

  return (
    <TooltipProvider>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {badges.map(({ key, color }) => {
          const c = colorMap[color];
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <span className={`inline-flex cursor-default items-center gap-1.5 rounded-full border ${c.border} ${c.bg} px-2.5 py-0.5 text-xs ${c.text}`}>
                  <span className={`h-1 w-1 rounded-full ${c.dot}`} />
                  {t(`${key}Badge`)}
                  <Info className={`h-3 w-3 ${c.info}`} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {t(`${key}BadgeTooltip`)}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
