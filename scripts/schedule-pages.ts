#!/usr/bin/env bun
/**
 * Wiki publish-schedule CLI.
 *
 * Reads all wiki entries from lib/content/wiki-toc.ts and assigns a
 * publishAt timestamp to every entry that does not yet have one. The
 * schedule writes to lib/content/wiki-publish-schedule.json.
 *
 * Constraints:
 *   - 18 to 22 releases per week (randomised each week).
 *   - Mon-Fri only, no weekends.
 *   - 09:00-18:00 Berlin local time only.
 *   - Author rotation: prefer not two consecutive same-author slots.
 *   - Existing scheduled entries are preserved (idempotent).
 *
 * Usage:
 *   bun run scripts/schedule-pages.ts
 *   bun run scripts/schedule-pages.ts --dry        (preview only, no write)
 *   bun run scripts/schedule-pages.ts --reset      (clears existing schedule first — past entries get re-dated)
 *   bun run scripts/schedule-pages.ts --rebalance  (clears only FUTURE entries; past schedule preserved)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WIKI_TOP_LEVEL, WIKI_TOC, type WikiTocEntry } from "../lib/content/wiki-toc";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCHEDULE_PATH = resolve(SCRIPT_DIR, "..", "lib", "content", "wiki-publish-schedule.json");

interface ScheduleFile {
  _doc?: string;
  _format?: string;
  schedule: Record<string, string>;
}

const DRY = process.argv.includes("--dry");
const RESET = process.argv.includes("--reset");
const REBALANCE = process.argv.includes("--rebalance");

function loadSchedule(): ScheduleFile {
  if (!existsSync(SCHEDULE_PATH)) {
    return { schedule: {} };
  }
  const raw = readFileSync(SCHEDULE_PATH, "utf8");
  return JSON.parse(raw) as ScheduleFile;
}

function saveSchedule(file: ScheduleFile): void {
  writeFileSync(SCHEDULE_PATH, JSON.stringify(file, null, 2) + "\n", "utf8");
}

/** Berlin local datetime -> UTC ISO 8601 with rough DST handling (Apr-Oct CEST, Nov-Mar CET). */
function berlinToUtcIso(year: number, month0: number, day: number, hour: number, minute: number): string {
  const isSummer = month0 >= 3 && month0 <= 9;
  const offsetHours = isSummer ? 2 : 1;
  const utc = new Date(Date.UTC(year, month0, day, hour - offsetHours, minute, 0));
  return utc.toISOString();
}

/** First weekday Monday on or after the given date. */
function nextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? 1 : day <= 1 ? 1 - day : 8 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float in [min, max). */
function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Generate N publish slots for a week starting on the given Monday. */
function generateWeekSlots(monday: Date, count: number): Date[] {
  // Distribute count across Mon-Fri as evenly as possible, with a small random shuffle.
  const perDay = [0, 0, 0, 0, 0];
  for (let i = 0; i < count; i++) perDay[i % 5]++;
  // Shuffle the per-day distribution so it's not always front-loaded on Monday.
  for (let i = perDay.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [perDay[i], perDay[j]] = [perDay[j], perDay[i]];
  }

  const slots: Date[] = [];
  for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
    const day = new Date(monday);
    day.setDate(day.getDate() + dayIdx);
    for (let s = 0; s < perDay[dayIdx]; s++) {
      const hour = Math.floor(randFloat(9, 18)); // 9..17
      const minute = randInt(0, 59);
      // Build Berlin local then convert to UTC ISO.
      const iso = berlinToUtcIso(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
        minute,
      );
      slots.push(new Date(iso));
    }
  }
  slots.sort((a, b) => a.getTime() - b.getTime());
  return slots;
}

/** Interleave entries by author so consecutive slots prefer different authors. */
function interleaveByAuthor(entries: WikiTocEntry[]): WikiTocEntry[] {
  const simon: WikiTocEntry[] = [];
  const cory: WikiTocEntry[] = [];
  for (const e of entries) {
    if (e.authorSlug === "cory-hisey") cory.push(e);
    else simon.push(e);
  }
  const out: WikiTocEntry[] = [];
  while (simon.length > 0 || cory.length > 0) {
    // Place the larger pool's next entry first if pools are uneven, so we exhaust evenly.
    if (cory.length === 0) {
      const next = simon.shift();
      if (next) out.push(next);
      continue;
    }
    if (simon.length === 0) {
      const next = cory.shift();
      if (next) out.push(next);
      continue;
    }
    // Both non-empty: alternate, but bias toward the larger pool.
    const pickSimon = simon.length >= cory.length
      ? out.length % 2 === 0
      : out.length % 3 === 0;
    const next = pickSimon ? simon.shift() : cory.shift();
    if (next) out.push(next);
  }
  return out;
}

function main(): void {
  const file = loadSchedule();
  if (RESET) {
    console.log("⚠  --reset: clearing existing schedule entries");
    file.schedule = {};
  } else if (REBALANCE) {
    // Strip only future-dated slots. Past entries (already published) stay
    // frozen at the date they actually went out so the public history isn't
    // rewritten. The default scheduling loop will then re-spread the
    // pending pool evenly across the weeks following the latest past slot.
    const now = new Date();
    const before = Object.keys(file.schedule).length;
    const kept: Record<string, string> = {};
    for (const [slug, ts] of Object.entries(file.schedule)) {
      if (new Date(ts) <= now) kept[slug] = ts;
    }
    file.schedule = kept;
    const removed = before - Object.keys(kept).length;
    console.log(
      `⚠  --rebalance: cleared ${removed} future entries, kept ${Object.keys(kept).length} past entries`,
    );
  }
  const scheduled = file.schedule;

  // Collect all wiki entries across categories.
  const allEntries: WikiTocEntry[] = [];
  for (const cat of WIKI_TOP_LEVEL) {
    for (const e of WIKI_TOC[cat].entries) allEntries.push(e);
  }

  const unscheduled = allEntries.filter((e) => !(e.slug in scheduled));
  if (unscheduled.length === 0) {
    console.log("✓ Nothing to schedule. All entries have a publishAt slot.");
    return;
  }

  console.log(`Scheduling ${unscheduled.length} unscheduled entries…`);

  // Pick a start: day AFTER the latest already-scheduled slot, or next Monday from today.
  let cursor = new Date();
  for (const ts of Object.values(scheduled)) {
    const d = new Date(ts);
    if (d > cursor) cursor = d;
  }
  // Round up to next Monday 00:00 Berlin local
  let weekMonday = nextMonday(cursor);

  // Author-rotated order.
  const ordered = interleaveByAuthor(unscheduled);

  let idx = 0;
  while (idx < ordered.length) {
    const target = randInt(18, 22);
    const remaining = ordered.length - idx;
    const count = Math.min(target, remaining);
    const slots = generateWeekSlots(weekMonday, count);
    for (const slot of slots) {
      if (idx >= ordered.length) break;
      const entry = ordered[idx]!;
      scheduled[entry.slug] = slot.toISOString();
      idx++;
    }
    // Next week
    weekMonday = new Date(weekMonday);
    weekMonday.setDate(weekMonday.getDate() + 7);
  }

  // Print a summary
  const byWeek = new Map<string, number>();
  const authorCount = { simon: 0, cory: 0 };
  for (const entry of ordered) {
    const ts = scheduled[entry.slug];
    if (!ts) continue;
    const d = new Date(ts);
    const wk = nextMonday(new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
    if (entry.authorSlug === "cory-hisey") authorCount.cory++;
    else authorCount.simon++;
  }
  console.log("\nPlanned releases per week:");
  for (const [wk, n] of [...byWeek.entries()].sort()) {
    console.log(`  week of ${wk}: ${n}`);
  }
  console.log(`\nAuthor mix: Simon=${authorCount.simon}, Cory=${authorCount.cory}`);

  // Preview a sample
  const sample = ordered.slice(0, Math.min(5, ordered.length));
  console.log("\nFirst entries:");
  for (const e of sample) {
    const ts = scheduled[e.slug];
    const local = ts ? new Date(ts).toLocaleString("de-DE", { timeZone: "Europe/Berlin" }) : "—";
    console.log(`  ${e.slug.padEnd(40)} ${ts}  (Berlin: ${local})  [${e.authorSlug ?? "simon-orzel"}]`);
  }

  if (DRY) {
    console.log("\n--dry: not writing schedule file.");
    return;
  }
  saveSchedule(file);
  console.log(`\n✓ Wrote ${SCHEDULE_PATH}`);
}

main();
