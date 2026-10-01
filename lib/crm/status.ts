/**
 * What the platform admin's Close tab shows: whether this server can sync at all,
 * how far the sync has got through the accounts, what Close refused, and the last
 * runs as they were logged. Settings are reported as set or not, never their values.
 */
import "@/lib/server-guard";
import { and, count, desc, eq, inArray, isNotNull, isNull, max, sql } from "drizzle-orm";
import { isDeployedServer } from "@/lib/cron/in-app";
import type { DbOrTx } from "@/lib/db";
import { env } from "@/lib/env";
import { auditLog, closeCrmSync, user } from "@/schema";
import { CLOSE_CONFIGURABLE_KEYS } from "./config-schema";
import {
  CLOSE_SYNC_ACTION,
  CLOSE_SYNC_INTERVAL_MS,
  type CloseSyncState,
  FIRST_RUN_DELAY_MS,
} from "./schedule";
import { isSyncedAccount } from "./store";
import { MAX_PER_RUN, MAX_REFUSALS } from "./sync";

const RECENT_RUNS = 20;
const RECENT_ERRORS = 10;

const STATE_OF_ACTION = new Map<string, CloseSyncState>(
  (Object.keys(CLOSE_SYNC_ACTION) as CloseSyncState[]).map((state) => [
    CLOSE_SYNC_ACTION[state],
    state,
  ]),
);

const setup = () => ({
  apiKey: Boolean(env.CLOSE_API_KEY),
  deployedServer: isDeployedServer(),
  signupStatus: Boolean(env.CLOSE_SIGNUP_STATUS_ID),
  suppressedStatus: Boolean(env.CLOSE_SUPPRESSED_STATUS_ID),
  fields: CLOSE_CONFIGURABLE_KEYS.map((key) => ({
    key,
    set: Boolean(env.CLOSE_FIELD_IDS[key]),
  })),
});

const people = async (db: DbOrTx) => {
  const [[accounts], [erasures]] = await Promise.all([
    db
      .select({
        synced: count(),
        inClose: count(closeCrmSync.syncedAt),
        retrying:
          sql<number>`count(*) filter (where ${closeCrmSync.rejectedCount} between 1 and ${MAX_REFUSALS - 1})`.mapWith(
            Number,
          ),
        gaveUp:
          sql<number>`count(*) filter (where ${closeCrmSync.rejectedCount} >= ${MAX_REFUSALS})`.mapWith(
            Number,
          ),
        lastWriteAt: max(closeCrmSync.syncedAt),
      })
      .from(user)
      .leftJoin(closeCrmSync, eq(closeCrmSync.userId, user.id))
      .where(isSyncedAccount()),
    db.select({ queued: count() }).from(closeCrmSync).where(isNull(closeCrmSync.userId)),
  ]);
  return {
    accounts: accounts?.synced ?? 0,
    inClose: accounts?.inClose ?? 0,
    retrying: accounts?.retrying ?? 0,
    gaveUp: accounts?.gaveUp ?? 0,
    lastWriteAt: accounts?.lastWriteAt ?? null,
    erasuresQueued: erasures?.queued ?? 0,
  };
};

/** The people Close refused most recently, with the reason it gave (field names, never values). */
const refusals = (db: DbOrTx) =>
  db
    .select({
      email: user.email,
      refusals: closeCrmSync.rejectedCount,
      error: closeCrmSync.lastError,
      at: closeCrmSync.updatedAt,
    })
    .from(closeCrmSync)
    .leftJoin(user, eq(user.id, closeCrmSync.userId))
    .where(and(isNotNull(closeCrmSync.lastError), isNotNull(closeCrmSync.userId)))
    .orderBy(desc(closeCrmSync.updatedAt))
    .limit(RECENT_ERRORS);

const runs = async (db: DbOrTx) => {
  const rows = await db
    .select({
      at: auditLog.createdAt,
      action: auditLog.action,
      description: auditLog.description,
    })
    .from(auditLog)
    .where(inArray(auditLog.action, Object.values(CLOSE_SYNC_ACTION)))
    .orderBy(desc(auditLog.createdAt))
    .limit(RECENT_RUNS);
  return rows.map((row) => ({
    at: row.at,
    state: STATE_OF_ACTION.get(row.action) ?? "failed",
    log: row.description,
  }));
};

export async function closeSyncStatus(db: DbOrTx) {
  const [counts, refused, recent] = await Promise.all([
    people(db),
    refusals(db),
    runs(db),
  ]);
  const schedule = {
    everyMinutes: CLOSE_SYNC_INTERVAL_MS / 60_000,
    firstRunMinutes: FIRST_RUN_DELAY_MS / 60_000,
    perRun: MAX_PER_RUN,
  };
  return { setup: setup(), schedule, people: counts, refused, runs: recent };
}
