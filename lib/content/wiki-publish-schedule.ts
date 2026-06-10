/**
 * Wiki publish schedule.
 *
 * Each wiki entry can have an optional `publishAt` timestamp stored in
 * `wiki-publish-schedule.json` (slug -> ISO 8601 UTC). The runtime
 * filters out entries whose `publishAt` is in the future:
 *
 *   - sitemap.xml excludes them
 *   - the /wiki hub + category index pages exclude them
 *   - the per-page WikiPageJsonLd guard 404s in production
 *
 * Default behaviour: a slug NOT in the schedule is treated as published.
 * That keeps existing pages live and lets newly added pages opt in to
 * the queue without breaking anything.
 *
 * The schedule file is generated and updated by
 * `scripts/schedule-pages.ts`, which spaces unscheduled pages across
 * Mon-Fri 09:00-18:00 CET at 18-22 per week with author rotation.
 *
 * Run with `--rebalance` to re-spread the pending pool while keeping
 * past entries frozen at their actual publish dates.
 */

import schedule from "./wiki-publish-schedule.json";

interface ScheduleFile {
  schedule: Record<string, string>;
}

const SCHEDULE_MAP = (schedule as ScheduleFile).schedule ?? {};

/** ISO 8601 timestamp at which the slug becomes published, or null if not scheduled (= already live). */
export function getPublishAt(slug: string): string | null {
  return SCHEDULE_MAP[slug] ?? null;
}

/**
 * Whether the slug is published as of `now`. Slugs not in the schedule
 * are treated as published (legacy / immediate-publish default).
 */
export function isPublished(slug: string, now: Date = new Date()): boolean {
  const publishAt = SCHEDULE_MAP[slug];
  if (!publishAt) return true;
  return new Date(publishAt) <= now;
}

/** All slugs with a future publishAt — i.e. scheduled but not yet live. */
export function pendingSlugs(now: Date = new Date()): string[] {
  return Object.entries(SCHEDULE_MAP)
    .filter(([, ts]) => new Date(ts) > now)
    .map(([slug]) => slug);
}

/** Full schedule map (read-only). Used by the CLI tool. */
export function getScheduleMap(): Readonly<Record<string, string>> {
  return SCHEDULE_MAP;
}
