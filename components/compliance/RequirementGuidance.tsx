"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequirementGuidanceProps {
  guide: string;
}

export function RequirementGuidance({ guide }: RequirementGuidanceProps) {
  const t = useTranslations("compliance");
  const [expanded, setExpanded] = useState(false);

  const isLong = guide.length > 300;
  const displayText = isLong && !expanded ? guide.slice(0, 300) + "..." : guide;

  return (
    <div className="rounded-md bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 p-3 text-sm">
      <p className="font-medium text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-1">
        {t("implementationGuide")}
      </p>
      <p className="text-foreground whitespace-pre-line">{displayText}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
        >
          {expanded ? t("showLess") : t("showMore")}
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
