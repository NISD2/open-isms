export const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

export function isSeverity(value: string): value is Severity {
  return SEVERITY_ORDER.includes(value as Severity);
}

export function severityColor(value: string): string | undefined {
  return isSeverity(value) ? SEVERITY_COLORS[value] : undefined;
}
