/**
 * Runs the daily deadline job inside the app, like the Close sync (lib/crm/schedule.ts), so
 * nisd2.eu needs no scheduled task outside it. Started once per server by instrumentation.ts; the
 * endpoint /api/cron/deadlines calls the same deadlinesOnce for a manual run or an outside cron.
 *
 * Once per Berlin calendar day, from 06:00 Berlin, whoever triggers it. Each run records the day it
 * ran for in its audit row, and a run that finds that day already recorded does nothing. That keeps
 * the escalations in phase 4 from running twice when both this schedule and an outside cron still
 * call it, and it reads a value the run wrote, never a database timestamp, whose time zone the
 * database decides. A failed run records no day, so the next check tries again.
 */
import "@/lib/server-guard";
import { and, eq, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { auditLog } from "@/schema";
import { berlinDay, berlinHour } from "./berlin-calendar";
import { type DeadlineStats, runDeadlines } from "./deadlines";
import { isDeployedServer, withAdvisoryLock } from "./in-app";

/** How often the schedule looks whether today's run is due. */
export const DEADLINES_CHECK_INTERVAL_MS = 30 * 60_000;
/** Lets a fresh server settle before the first check. */
const FIRST_CHECK_DELAY_MS = 3 * 60_000;
/** The run is due from this hour, Berlin time. */
export const DEADLINES_FROM_HOUR = 6;
/** Arbitrary, fixed, and used for nothing else. */
const DEADLINES_LOCK = 7_346_201_905;

export const DEADLINES_ACTION = {
  completed: "cron.deadlines",
  failed: "cron.deadlines.error",
} as const;

const ranFor = async (day: string): Promise<boolean> => {
  const [row] = await db
    .select({ id: auditLog.id })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, DEADLINES_ACTION.completed),
        sql`${auditLog.newValue}->>'day' = ${day}`,
      ),
    )
    .limit(1);
  return row !== undefined;
};

export type DeadlinesOutcome =
  | { readonly kind: "ran"; readonly elapsed: number; readonly stats: DeadlineStats }
  | { readonly kind: "skipped"; readonly reason: string }
  | { readonly kind: "failed"; readonly elapsed: number; readonly error: string };

/**
 * Run today's deadline job unless it already ran for today, and record it. Never throws; a failure
 * is returned and logged, with the full error only in the container log.
 */
export async function deadlinesOnce(
  trigger: "schedule" | "manual",
  now: Date = new Date(),
): Promise<DeadlinesOutcome> {
  const day = berlinDay(now);
  const started = Date.now();
  const outcome: DeadlinesOutcome = await withAdvisoryLock(
    DEADLINES_LOCK,
    "deadlines",
    async (): Promise<DeadlinesOutcome> => {
      if (await ranFor(day)) {
        return { kind: "skipped", reason: `already ran for ${day}` };
      }
      const stats = await runDeadlines();
      const elapsed = Date.now() - started;
      await logAudit({
        companyId: null,
        userId: null,
        action: DEADLINES_ACTION.completed,
        entityType: "system",
        entityId: null,
        description: `Deadlines (${trigger}) for ${day} completed in ${elapsed}ms: ${JSON.stringify(stats)}`,
        newValue: { day, trigger, stats },
      });
      return { kind: "ran", elapsed, stats };
    },
  ).then(
    (locked) =>
      locked.locked
        ? locked.value
        : { kind: "skipped", reason: "a deadlines run is already in progress" },
    (err: unknown) => ({
      kind: "failed",
      elapsed: Date.now() - started,
      error: err instanceof Error ? err.message : "Unknown error",
    }),
  );

  if (outcome.kind === "failed") {
    console.error(`[deadlines] (${trigger}) failed for ${day}: ${outcome.error}`);
    await logAudit({
      companyId: null,
      userId: null,
      action: DEADLINES_ACTION.failed,
      entityType: "system",
      entityId: null,
      description: `Deadlines (${trigger}) for ${day} failed: ${outcome.error}`,
    });
  } else if (outcome.kind === "ran") {
    console.info(`[deadlines] (${trigger}) ran for ${day} in ${outcome.elapsed}ms`);
  }
  return outcome;
}

/** Whether a scheduled check at `now` should try today's run. */
const isDue = (now: Date): boolean => berlinHour(now) >= DEADLINES_FROM_HOUR;

/** Start the schedule. Does nothing outside a deployed production server. */
export function startDeadlinesSchedule(): void {
  if (!isDeployedServer()) {
    console.info("[deadlines] not scheduled: not a deployed production server");
    return;
  }
  console.info(
    `[deadlines] scheduled: daily from ${DEADLINES_FROM_HOUR}:00 Berlin, checked every ${DEADLINES_CHECK_INTERVAL_MS / 60_000} min`,
  );
  const tick = () => {
    const now = new Date();
    if (isDue(now)) void deadlinesOnce("schedule", now);
  };
  setTimeout(() => {
    tick();
    setInterval(tick, DEADLINES_CHECK_INTERVAL_MS).unref();
  }, FIRST_CHECK_DELAY_MS).unref();
}
