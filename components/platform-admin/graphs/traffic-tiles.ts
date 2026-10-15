/**
 * The numbers on the Traffic tiles, derived from one window of totals and the window before it.
 * Pure, so the arithmetic is tested and the component only lays it out.
 */

import type { Totals, TrafficStats } from "@/lib/analytics/umami";

export interface TileNumbers {
  /** Visits that viewed more than one page. Automated traffic rarely does. */
  engaged: number;
  visits: number;
  /** Null when there were no visits to average over. */
  pagesPerVisit: number | null;
  secondsPerVisit: number | null;
  /** Share of visits that left after one page, 0 to 1. */
  singlePageShare: number | null;
}

const perVisit = (total: number, visits: number): number | null =>
  visits === 0 ? null : total / visits;

export const tileNumbers = (totals: Totals): TileNumbers => ({
  engaged: totals.visits - totals.bounces,
  visits: totals.visits,
  pagesPerVisit: perVisit(totals.pageviews, totals.visits),
  secondsPerVisit: perVisit(totals.totaltime, totals.visits),
  singlePageShare: perVisit(totals.bounces, totals.visits),
});

export function trafficTiles(stats: TrafficStats): {
  now: TileNumbers;
  previous: TileNumbers | null;
} {
  return {
    now: tileNumbers(stats),
    previous: stats.previous === null ? null : tileNumbers(stats.previous),
  };
}

/** Whole-percent change from `before` to `now`; null when there is nothing to compare against. */
export function percentChange(now: number | null, before: number | null): number | null {
  if (now === null || before === null || before === 0) return null;
  return Math.round(((now - before) / before) * 100);
}

/** 150 -> "2m 30s", 45 -> "45s". */
export function duration(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return minutes === 0
    ? `${whole}s`
    : `${minutes}m ${String(whole % 60).padStart(2, "0")}s`;
}
