/**
 * Runs the close-sync inside the app, so nisd2.eu needs no scheduled task outside
 * it. Started once per server by instrumentation.ts; the cron endpoint calls the
 * same closeSyncOnce for a manual run.
 *
 * Off without CLOSE_API_KEY, and only in a production server, so a developer with
 * a key in their .env never pushes a local database into the live CRM.
 *
 * A Postgres advisory lock lets one run happen at a time across every server: two
 * containers during a deploy, or the schedule and a manual call, never write the
 * same people twice.
 */
import "@/lib/server-guard";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { closeSettings } from "./close";
import { closeSyncStore } from "./store";
import { type CloseSyncRunResult, runCloseSync } from "./sync";

export const CLOSE_SYNC_INTERVAL_MS = 30 * 60_000;
/** Lets a fresh server settle, and keeps a crash loop from hammering Close. */
const FIRST_RUN_DELAY_MS = 2 * 60_000;
/** Arbitrary, fixed, and used for nothing else. */
const CLOSE_SYNC_LOCK = 7_346_201_904;

/** One run under the lock; "skipped" when another server holds it. */
const runLocked = async (): Promise<CloseSyncRunResult> => {
  const settings = closeSettings(env);
  if (!settings) return { skipped: "CLOSE_API_KEY is not set" };

  const client = await db.$client.connect();
  try {
    const { rows } = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [CLOSE_SYNC_LOCK],
    );
    if (!rows[0]?.locked) return { skipped: "a close-sync run is already in progress" };
    try {
      return await runCloseSync(closeSyncStore(db), settings);
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [CLOSE_SYNC_LOCK]);
    }
  } finally {
    client.release();
  }
};

export type CloseSyncOutcome =
  | { readonly ok: true; readonly elapsed: number; readonly result: CloseSyncRunResult }
  | { readonly ok: false; readonly elapsed: number; readonly error: string };

/**
 * A run that needs a person to look: it stopped early (Close unavailable, or a
 * field setting Close refuses) or Close turned an erasure down.
 */
export const closeSyncFailed = (result: CloseSyncRunResult): boolean =>
  !("skipped" in result) && (result.stopped !== null || result.erasureRefused > 0);

/**
 * Run once and record it in the audit log; a failed run, or one that threw, is
 * logged as cron.close_sync.error. Never throws.
 */
export async function closeSyncOnce(
  trigger: "schedule" | "manual",
): Promise<CloseSyncOutcome> {
  const started = Date.now();
  const outcome: CloseSyncOutcome = await runLocked().then(
    (result) => ({ ok: true, elapsed: Date.now() - started, result }),
    (err: unknown) => ({
      ok: false,
      elapsed: Date.now() - started,
      error: err instanceof Error ? err.message : "Unknown error",
    }),
  );
  const failed = !outcome.ok || closeSyncFailed(outcome.result);
  logAudit({
    companyId: null,
    userId: null,
    action: failed ? "cron.close_sync.error" : "cron.close_sync",
    entityType: "system",
    entityId: null,
    description: `Close sync (${trigger}) ${failed ? "failed" : "completed"} in ${outcome.elapsed}ms: ${JSON.stringify(outcome.ok ? outcome.result : outcome.error)}`,
  });
  return outcome;
}

/** Start the schedule. Does nothing outside a production server or without a key. */
export function startCloseSyncSchedule(): void {
  if (process.env.NODE_ENV !== "production" || !closeSettings(env)) return;
  const tick = () => void closeSyncOnce("schedule");
  setTimeout(() => {
    tick();
    setInterval(tick, CLOSE_SYNC_INTERVAL_MS).unref();
  }, FIRST_RUN_DELAY_MS).unref();
}
