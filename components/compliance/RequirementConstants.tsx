"use client";

import type { Frequency } from "@nisd2/grc-data-model/frameworks";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Requirements where the built-in CEO management training course satisfies
// the §38(3) BSIG / Art. 20(2) NIS2 training obligation.
export const CEO_COURSE_REQUIREMENT_CODES = new Set(["1.1", "8.3"]);

/** Each frequency's name, under `intake` in the compliance messages of every locale. */
export const FREQUENCY_LABEL: Readonly<Record<Frequency, string>> = {
  "one-time": "frequencyOneTime",
  monthly: "frequencyMonthly",
  quarterly: "frequencyQuarterly",
  "semi-annual": "frequencySemiAnnual",
  annual: "frequencyAnnual",
  "every-3-years": "frequencyEvery3Years",
  "on-change": "frequencyOnChange",
  ongoing: "frequencyOngoing",
};

// ---------------------------------------------------------------------------
// Shared status/priority display constants
//
// Status renders as a 6px dot + label rather than a coloured pill — colour
// stays as information (the dot), not chrome (a full pill background), which
// keeps lists scannable at a glance.
// ---------------------------------------------------------------------------

export const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500",
  P1: "bg-orange-500",
  P2: "bg-yellow-500",
  P3: "bg-emerald-500",
};

const STATUS_DOT_CLASS: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  approved: "bg-emerald-500",
  not_applicable: "bg-muted-foreground/40",
  needs_review: "bg-orange-500",
  rejected: "bg-destructive",
};

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const dotClass = STATUS_DOT_CLASS[status] ?? STATUS_DOT_CLASS.not_started;
  return (
    <span
      aria-hidden
      className={cn("inline-block h-1.5 w-1.5 rounded-full", dotClass, className)}
    />
  );
}

/** The status in the reader's language, from the shared `status` messages; an unknown one reads as not started. */
export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("status");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <StatusDot status={status} />
      {t.has(status) ? t(status) : t("not_started")}
    </span>
  );
}

const PRIORITY_LABELS: Record<string, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const dot = PRIORITY_COLORS[priority] ?? "bg-muted-foreground/40";
  const label = PRIORITY_LABELS[priority] ?? priority;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
      <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}
