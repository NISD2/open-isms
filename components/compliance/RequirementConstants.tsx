"use client";

import { cn } from "@/lib/utils";

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

export const STATUS_STYLES: Record<string, { label: string; dotClass: string }> = {
  not_started:    { label: "Not started",   dotClass: "bg-muted-foreground/40" },
  in_progress:    { label: "In progress",   dotClass: "bg-blue-500" },
  completed:      { label: "Completed",     dotClass: "bg-emerald-500" },
  approved:       { label: "Approved",      dotClass: "bg-emerald-500" },
  not_applicable: { label: "N/A",           dotClass: "bg-muted-foreground/40" },
  needs_review:   { label: "Needs review",  dotClass: "bg-orange-500" },
  rejected:       { label: "Rejected",      dotClass: "bg-destructive" },
};

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.not_started;
  return <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", style.dotClass, className)} />;
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.not_started;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <StatusDot status={status} />
      {style.label}
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
