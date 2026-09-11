/**
 * Range and bucket arithmetic for the Graphs tab.
 *
 * Days are "YYYY-MM-DD" strings throughout — the same UTC calendar days the
 * server grouped by. Nothing here builds a Date from a bare day string and
 * reads local components off it, because that shifts the day for every viewer
 * west of UTC; parsing pins midday UTC and every format call names UTC.
 */

export const RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "1 month", days: 30 },
  { key: "60d", label: "2 months", days: 60 },
  { key: "90d", label: "3 months", days: 90 },
  { key: "180d", label: "6 months", days: 180 },
  { key: "365d", label: "12 months", days: 365 },
  { key: "all", label: "All time", days: null },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];
export type Granularity = "day" | "week" | "month";
/** "auto" resolves from the range width; the rest are the operator's override. */
export type GranularityChoice = Granularity | "auto";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midday UTC, so no viewer's timezone can push the date onto its neighbour. */
export function parseDay(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, delta: number): string {
  return toDay(new Date(parseDay(day).getTime() + delta * DAY_MS));
}

/** Whole days between two calendar days, end exclusive of nothing. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS);
}

/** Today as a UTC calendar day — the same clock the server grouped by. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Every day from `from` to `to` inclusive, oldest first. */
export function eachDay(from: string, to: string): string[] {
  const span = daysBetween(from, to);
  if (span < 0) return [];
  return Array.from({ length: span + 1 }, (_, i) => addDays(from, i));
}

/**
 * Bucket width that keeps a chart readable: roughly 7 to 60 marks on screen.
 * Overridable, because "show me the daily shape of the last year" is a real
 * question even when it renders 365 thin columns.
 */
export function resolveGranularity(
  choice: GranularityChoice,
  spanDays: number,
): Granularity {
  if (choice !== "auto") return choice;
  if (spanDays <= 60) return "day";
  if (spanDays <= 300) return "week";
  return "month";
}

/** The bucket a day belongs to. Weeks start Monday. */
export function bucketOf(day: string, granularity: Granularity): string {
  if (granularity === "day") return day;
  if (granularity === "month") return day.slice(0, 7);
  const date = parseDay(day);
  const weekday = (date.getUTCDay() + 6) % 7;
  return addDays(day, -weekday);
}

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

export function bucketLabel(bucket: string, granularity: Granularity): string {
  if (granularity === "month") return MONTH_LABEL.format(parseDay(`${bucket}-01`));
  return DAY_LABEL.format(parseDay(bucket));
}

/** Long form for tooltips and table rows, where there is room to be exact. */
export function bucketTitle(bucket: string, granularity: Granularity): string {
  if (granularity === "month") return MONTH_LABEL.format(parseDay(`${bucket}-01`));
  if (granularity === "day") return DAY_LABEL.format(parseDay(bucket));
  return `week of ${DAY_LABEL.format(parseDay(bucket))}`;
}

export interface RangeWindow {
  /** First day plotted. */
  start: string;
  /** Last day plotted, always today. */
  end: string;
  granularity: Granularity;
  /** The equally long window immediately before `start`, for period deltas. */
  previousStart: string;
  previousEnd: string;
}

export function resolveWindow(
  rangeKey: RangeKey,
  granularityChoice: GranularityChoice,
  earliestDay: string,
  today: string,
): RangeWindow {
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[RANGES.length - 1];
  // A fixed range always plots its full width, even where that reaches back
  // before the first signup: leading zeroes say "we did not exist yet", which
  // is the truth, and clamping would quietly shrink the window a delta is
  // measured against.
  const start = range.days === null ? earliestDay : addDays(today, -(range.days - 1));
  const span = daysBetween(start, today) + 1;
  return {
    start,
    end: today,
    granularity: resolveGranularity(granularityChoice, span),
    previousStart: addDays(start, -span),
    previousEnd: addDays(start, -1),
  };
}

/**
 * Roll a dense daily series up into buckets.
 *
 * `mode` decides what a bucket means. "sum" totals the days in it (new
 * accounts this week). "last" takes the final day's value (a running total is
 * already cumulative, so summing it would square the curve).
 */
export function bucketSeries<T extends Record<string, number>>(
  days: string[],
  granularity: Granularity,
  sample: (day: string) => T,
  mode: "sum" | "last",
): Array<T & { bucket: string; label: string; title: string }> {
  const buckets: Array<{ bucket: string; value: Record<string, number> }> = [];

  for (const day of days) {
    const bucket = bucketOf(day, granularity);
    const value = sample(day);
    const open = buckets[buckets.length - 1];
    if (!open || open.bucket !== bucket) {
      buckets.push({ bucket, value: { ...value } });
      continue;
    }
    for (const [key, incoming] of Object.entries(value)) {
      open.value[key] = mode === "sum" ? (open.value[key] ?? 0) + incoming : incoming;
    }
  }

  return buckets.map(({ bucket, value }) => ({
    ...(value as T),
    bucket,
    label: bucketLabel(bucket, granularity),
    title: bucketTitle(bucket, granularity),
  }));
}
