/**
 * Rate limiter, counted in Postgres (`rate_limit_window`).
 *
 * The in-memory version this replaces was per process: a redeploy reset every
 * budget and a second replica doubled every limit. The window now lives in one
 * row per key, and one statement both counts a hit and decides it.
 *
 * A FIXED window, where the in-memory one slid: the first hit opens a window of
 * `windowMs`, up to `limit` hits pass inside it, and the first hit after it
 * closes opens the next. A caller who times it can get up to twice the limit
 * across a window boundary. Every limit here is a ceiling on abuse sized well
 * above honest use, so that edge is the price of a single atomic statement,
 * where an exact sliding window needs a row per hit.
 */
import "@/lib/server-guard";
import { and, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitWindow } from "@/schema";
import { publicRouteBudget, windowKey } from "./rate-limit-rules";

/** A window is over once reset_at has passed, for counting and cleanup alike. */
const expired = lte(rateLimitWindow.resetAt, sql`now()`);

/**
 * Counts one hit and says whether it is allowed.
 *
 * One statement, so concurrent hits on a key cannot both read the same count:
 * ON CONFLICT takes the row lock and evaluates the update against the latest
 * committed row. The first hit on a key inserts. A later hit either restarts an
 * expired window at 1 or adds 1 while the count is under the limit. At the limit
 * the WHERE fails, nothing is written and no row comes back: that is the denial.
 * The clock is the database's, so every replica agrees on when a window ends.
 */
async function countHit(
  rowKey: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const counted = await db
    .insert(rateLimitWindow)
    .values({
      key: rowKey,
      count: 1,
      resetAt: sql`now() + make_interval(secs => ${windowMs / 1000})`,
    })
    .onConflictDoUpdate({
      target: rateLimitWindow.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimitWindow.count} + 1 END`,
        resetAt: sql`CASE WHEN ${expired} THEN excluded.reset_at ELSE ${rateLimitWindow.resetAt} END`,
      },
      setWhere: sql`${expired} OR ${rateLimitWindow.count} < ${limit}`,
    })
    .returning({ key: rateLimitWindow.key });
  return counted.length > 0;
}

/**
 * Expired windows are deleted from the hit path, not by a cron route. The cron
 * routes need CRON_SECRET and an outside scheduler to call them (Coolify
 * scheduled tasks, see docs/coolify-deployment.md), and compose.self-host.yml
 * ships none. Such a job is also easy to forget: cleanupExpiredOtps in
 * lib/auth/otp.ts has no caller at all. Here one hit in SWEEP_ONE_IN
 * deletes up to SWEEP_BATCH expired rows. A hit writes at most one row, so
 * cleanup can remove five rows for every one traffic creates, and the table
 * stays at the live windows plus a short tail whatever the traffic.
 */
const SWEEP_ONE_IN = 100;
const SWEEP_BATCH = 500;

/**
 * Deletes up to `batch` expired windows and returns how many went. Dropping an
 * expired window cannot hand anyone a budget: their next hit would restart it
 * anyway. The subquery locks each row it picks and re-checks it is still expired
 * as it does, so a window a concurrent hit has just restarted is left alone, and
 * SKIP LOCKED leaves a row a hit holds right now to a later sweep, so a sweep
 * never waits on a hit or on another sweep. The outer `expired` keeps the DELETE
 * safe on its own.
 */
export async function sweepExpiredWindows(batch: number = SWEEP_BATCH): Promise<number> {
  const due = db
    .select({ key: rateLimitWindow.key })
    .from(rateLimitWindow)
    .where(expired)
    .limit(batch)
    .for("update", { skipLocked: true });
  const result = await db
    .delete(rateLimitWindow)
    .where(and(inArray(rateLimitWindow.key, due), expired));
  return result.rowCount ?? 0;
}

/**
 * Returns `true` if the request is allowed, `false` if it is rate-limited.
 *
 * FAILS OPEN, and this is the only place that decides it. When a hit cannot be
 * counted (database unreachable, statement error) the request is allowed and
 * the error logged. Most routes behind this limiter need the same database for
 * their own work, so during an outage the request fails at its next query
 * anyway, and failing closed would turn a fault in the limiter alone into every
 * user locked out of login. The cost: while the limiter is down, the routes that
 * work without the database lose their ceiling. Those are the public
 * questionnaire PDF and DOCX, and the applicability company search, which calls
 * the paid RapidAPI before it touches the database.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  try {
    const allowed = await countHit(windowKey(key), limit, windowMs);
    // Not awaited: the answer does not depend on it, so no request waits on it.
    if (Math.random() < 1 / SWEEP_ONE_IN) {
      void sweepExpiredWindows().catch((err) =>
        console.error("[rate-limit] sweep of expired windows failed:", err),
      );
    }
    return allowed;
  } catch (err) {
    console.error("[rate-limit] hit not counted, request allowed:", err);
    return true;
  }
}

/** Per-IP limit for an unauthenticated route; see publicRouteBudget for "unknown". */
export function rateLimitPublicRoute(
  name: string,
  ip: string,
  perIpPerMinute: number,
): Promise<boolean> {
  const { key, limit, windowMs } = publicRouteBudget(name, ip, perIpPerMinute);
  return rateLimit(key, limit, windowMs);
}
