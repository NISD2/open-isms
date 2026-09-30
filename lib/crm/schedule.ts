/**
 * Runs the close-sync inside the app, so nisd2.eu needs no scheduled task outside
 * it. Started once per server by instrumentation.ts; the cron endpoint calls the
 * same closeSyncOnce for a manual run.
 *
 * Off without CLOSE_API_KEY. Both the schedule and a manual run also refuse to run
 * anywhere but a deployed production server, so a developer with a key in their
 * .env never pushes a local database into the live CRM, nor erases live contacts
 * because local test users were deleted.
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
export const FIRST_RUN_DELAY_MS = 2 * 60_000;
/** Arbitrary, fixed, and used for nothing else. */
const CLOSE_SYNC_LOCK = 7_346_201_904;

/** The audit_log actions a run leaves behind; the platform admin's Close tab reads them back. */
export const CLOSE_SYNC_ACTION = {
  completed: "cron.close_sync",
  failed: "cron.close_sync.error",
  skipped: "cron.close_sync.skipped",
} as const;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** A production build serving a public address: not `next dev`, not a local container. */
export const isDeployedServer = (): boolean => {
  if (process.env.NODE_ENV !== "production") return false;
  try {
    return !LOCAL_HOSTS.has(new URL(env.NEXT_PUBLIC_APP_URL).hostname);
  } catch {
    return false;
  }
};

type Locked<T> =
  | { readonly locked: true; readonly value: T }
  | { readonly locked: false };

/**
 * Run fn while holding the advisory lock on a connection of its own. A checked-out
 * pg client has no pool error listener, so one is attached here: without it a
 * dropped connection would surface as an unhandled 'error' event and take the
 * server down. A connection that failed is destroyed rather than pooled, and its
 * session lock goes with it.
 */
const withCloseSyncLock = async <T>(fn: () => Promise<T>): Promise<Locked<T>> => {
  const client = await db.$client.connect();
  const onError = (err: Error) =>
    console.error(`[close] lock connection lost: ${err.message}`);
  client.on("error", onError);
  const attempt = async (): Promise<Locked<T>> => {
    const { rows } = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [CLOSE_SYNC_LOCK],
    );
    if (!rows[0]?.locked) return { locked: false };
    try {
      return { locked: true, value: await fn() };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [CLOSE_SYNC_LOCK]);
    }
  };
  try {
    const result = await attempt();
    client.release();
    return result;
  } catch (err) {
    client.release(err instanceof Error ? err : true);
    throw err;
  } finally {
    client.off("error", onError);
  }
};

const runLocked = async (): Promise<CloseSyncRunResult> => {
  const settings = closeSettings(env);
  if (!settings) return { skipped: "CLOSE_API_KEY is not set" };
  if (!isDeployedServer()) {
    return { skipped: "not a deployed production server (NODE_ENV or a local app URL)" };
  }
  const locked = await withCloseSyncLock(() =>
    runCloseSync(closeSyncStore(db), settings),
  );
  return locked.locked
    ? locked.value
    : { skipped: "a close-sync run is already in progress" };
};

export type CloseSyncOutcome =
  | { readonly ok: true; readonly elapsed: number; readonly result: CloseSyncRunResult }
  | { readonly ok: false; readonly elapsed: number; readonly error: string };

/**
 * A run that needs a person to look: it stopped early (Close unavailable, or a
 * setting Close refuses) or Close turned an erasure down.
 */
export const closeSyncFailed = (result: CloseSyncRunResult): boolean =>
  !("skipped" in result) && (result.stopped !== null || result.erasureRefused > 0);

export type CloseSyncState = keyof typeof CLOSE_SYNC_ACTION;

/** Failed (threw, stopped, or an erasure refused), skipped (never reached Close), or completed. */
export const closeSyncState = (outcome: CloseSyncOutcome): CloseSyncState => {
  if (!outcome.ok || closeSyncFailed(outcome.result)) return "failed";
  return "skipped" in outcome.result ? "skipped" : "completed";
};

/**
 * Run once and record it in the audit log under the action for its state
 * (CLOSE_SYNC_ACTION). Never throws.
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
  const state = closeSyncState(outcome);
  const description = `Close sync (${trigger}) ${state} in ${outcome.elapsed}ms: ${JSON.stringify(outcome.ok ? outcome.result : outcome.error)}`;
  // Also in the container log, so a run is visible where the deploy platform shows output.
  (state === "failed" ? console.error : console.info)(`[close] ${description}`);
  await logAudit({
    companyId: null,
    userId: null,
    action: CLOSE_SYNC_ACTION[state],
    entityType: "system",
    entityId: null,
    description,
  });
  return outcome;
}

/** Start the schedule. Does nothing without a key or outside a deployed server. */
export function startCloseSyncSchedule(): void {
  if (!closeSettings(env)) return;
  if (!isDeployedServer()) {
    console.info("[close] sync not scheduled: not a deployed production server");
    return;
  }
  console.info(
    `[close] sync scheduled: first run in ${FIRST_RUN_DELAY_MS / 60_000} min, then every ${CLOSE_SYNC_INTERVAL_MS / 60_000} min`,
  );
  const tick = () => void closeSyncOnce("schedule");
  setTimeout(() => {
    tick();
    setInterval(tick, CLOSE_SYNC_INTERVAL_MS).unref();
  }, FIRST_RUN_DELAY_MS).unref();
}
