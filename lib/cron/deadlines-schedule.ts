/**
 * Runs the daily deadline job inside the app, like the Close sync (lib/crm/schedule.ts), so
 * nisd2.eu needs no scheduled task outside it. Started once per server by instrumentation.ts; the
 * endpoint /api/cron/deadlines calls the same deadlinesOnce for a manual run or an outside cron.
 *
 * Once per day, whoever triggers it; the schedule tries from 06:00 Berlin. The day is the date the
 * job's own phases treat as today (toDateString, UTC), recorded in the run's audit row; a run that
 * finds its day recorded does nothing. The check reads a value the run wrote, never a database
 * timestamp, whose time zone the database decides. A failed run records no day, so the next check
 * tries again.
 */
import "@/lib/server-guard";
import { and, eq, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { toDateString } from "@/lib/compliance/deadlines";
import { db } from "@/lib/db";
import { auditLog } from "@/schema";
import { berlinHour } from "./berlin-calendar";
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

/**
 * Whether a completed run recorded this day. Only the last few days are searched, so the lookup can
 * use the created_at index instead of reading the whole audit log; a day's record is never older.
 */
const ranFor = async (day: string): Promise<boolean> => {
  const [row] = await db
    .select({ id: auditLog.id })
    .from(auditLog)
    .where(
      and(
        sql`${auditLog.createdAt} > now() - interval '3 days'`,
        eq(auditLog.action, DEADLINES_ACTION.completed),
        sql`${auditLog.newValue}->>'day' = ${day}`,
      ),
    )
    .limit(1);
  return row !== undefined;
};

export type DeadlinesOutcome =
  | {
      readonly kind: "ran";
      readonly day: string;
      readonly elapsed: number;
      readonly stats: DeadlineStats;
    }
  | {
      readonly kind: "skipped";
      readonly day: string;
      readonly why: "already_ran" | "in_progress";
    }
  | {
      readonly kind: "failed";
      readonly day: string;
      readonly elapsed: number;
      readonly error: string;
    };

/** What a skip means, for the endpoint's answer. */
export const skipReason = (outcome: Extract<DeadlinesOutcome, { kind: "skipped" }>) =>
  outcome.why === "already_ran"
    ? `already ran for ${outcome.day}`
    : "a deadlines run is already in progress";

/**
 * Run today's deadline job unless it already ran for today, and record it. Never throws; a failure
 * is returned and logged, with the full error only in the container log.
 */
export async function deadlinesOnce(
  trigger: "schedule" | "manual",
  now: Date = new Date(),
): Promise<DeadlinesOutcome> {
  const day = toDateString(now);
  const started = Date.now();
  const outcome: DeadlinesOutcome = await withAdvisoryLock(
    DEADLINES_LOCK,
    "deadlines",
    async (): Promise<DeadlinesOutcome> => {
      if (await ranFor(day)) return { kind: "skipped", day, why: "already_ran" };
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
      return { kind: "ran", day, elapsed, stats };
    },
  ).then(
    (locked) =>
      locked.locked ? locked.value : { kind: "skipped", day, why: "in_progress" },
    (err: unknown) => ({
      kind: "failed",
      day,
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

/** Whether an outcome means this day needs no more attempts from this server. */
const settles = (outcome: DeadlinesOutcome): boolean =>
  outcome.kind === "ran" || (outcome.kind === "skipped" && outcome.why === "already_ran");

/** Start the schedule. Does nothing outside a deployed production server. */
export function startDeadlinesSchedule(): void {
  if (!isDeployedServer()) {
    console.info("[deadlines] not scheduled: not a deployed production server");
    return;
  }
  console.info(
    `[deadlines] scheduled: daily from ${DEADLINES_FROM_HOUR}:00 Berlin, checked every ${DEADLINES_CHECK_INTERVAL_MS / 60_000} min`,
  );
  // The last day this server finished. If the run's audit row failed to insert (logAudit only
  // logs that), ranFor would never see the day, and without this every check would run again.
  let settledDay: string | null = null;
  const tick = () => {
    const now = new Date();
    if (!isDue(now) || settledDay === toDateString(now)) return;
    void deadlinesOnce("schedule", now).then((outcome) => {
      if (settles(outcome)) settledDay = outcome.day;
    });
  };
  setTimeout(() => {
    tick();
    setInterval(tick, DEADLINES_CHECK_INTERVAL_MS).unref();
  }, FIRST_CHECK_DELAY_MS).unref();
}
