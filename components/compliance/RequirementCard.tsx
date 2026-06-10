"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitials } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Circle,
  Clock,
  Ban,
  AlertTriangle,
  ChevronRight,
  Database,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeadlineBadge } from "./DeadlineBadge";
import { PriorityBadge } from "./RequirementConstants";

type Status =
  | "not_started"
  | "in_progress"
  | "completed"
  | "not_applicable"
  | "needs_review"
  | "approved"
  | "rejected";

interface RequirementCardProps {
  code: string;
  title: string;
  description: string;
  priority: string;
  frequency: string;
  legalRef: string | null;
  nextReviewDate?: string | null;
  moduleRef?: string | null;
  status: Status;
  assigneeName?: string | null;
  completionPct?: number | null;
  href: string;
}

const STATUS_BORDER: Record<Status, string> = {
  not_started: "border-border",
  in_progress: "border-l-2 border-l-blue-500 border-blue-200/50 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/10",
  completed: "border-l-2 border-l-emerald-500 border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10",
  not_applicable: "border-muted-foreground/20 bg-muted/30 opacity-60",
  needs_review: "border-l-2 border-l-amber-500 border-amber-200/50 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/10",
  approved: "border-l-2 border-l-emerald-500 border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10",
  rejected: "border-l-2 border-l-red-500 border-destructive/30 bg-destructive/5",
};

const STATUS_ICON: Record<Status, typeof CheckCircle2> = {
  not_started: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  not_applicable: Ban,
  needs_review: AlertTriangle,
  approved: CheckCircle2,
  rejected: XCircle,
};

const STATUS_ICON_COLOR: Record<Status, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-blue-500",
  completed: "text-emerald-500",
  not_applicable: "text-muted-foreground/40",
  needs_review: "text-orange-500",
  approved: "text-emerald-500",
  rejected: "text-red-500",
};

export function RequirementCard({
  code,
  title,
  description,
  priority,
  frequency,
  legalRef,
  nextReviewDate,
  moduleRef,
  status,
  assigneeName,
  completionPct,
  href,
}: RequirementCardProps) {
  const t = useTranslations("compliance");
  const tp = useTranslations("priority");
  const Icon = STATUS_ICON[status];
  const pct = completionPct ?? 0;

  return (
    <Link
      href={href as never}
      className={cn(
        "group flex gap-4 rounded-lg border p-5 transition-colors hover:border-foreground/20 hover:bg-accent/50",
        STATUS_BORDER[status],
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", STATUS_ICON_COLOR[status])} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{code}</span>
          <span className="font-medium flex-1">{title}</span>
          <span
            className={cn(
              "shrink-0 text-xs font-mono tabular-nums",
              pct >= 100
                ? "text-emerald-600 dark:text-emerald-400"
                : pct > 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground",
            )}
          >
            {pct}%
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {legalRef && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Info className="h-2.5 w-2.5" />
              {legalRef}
            </span>
          )}
          {moduleRef && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] gap-0.5">
                    <Database className="h-2.5 w-2.5" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{t("moduleBacked")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <PriorityBadge priority={priority} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tp(priority as "P0" | "P1" | "P2" | "P3")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DeadlineBadge nextReviewDate={nextReviewDate ?? null} frequency={frequency} />
          {assigneeName && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar size="sm">
                    <AvatarFallback className="text-[9px]">
                      {getInitials(assigneeName)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{t("assignedTo", { name: assigneeName })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
    </Link>
  );
}
