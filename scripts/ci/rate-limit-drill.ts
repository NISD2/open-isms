/**
 * rateLimit against a real Postgres. The limiter's promise is that parallel
 * hits on one key let exactly `limit` through, whichever process or replica
 * they land on, and only a database can show that: it rests on how INSERT ...
 * ON CONFLICT DO UPDATE serialises concurrent writers to one row. The drill
 * also covers what the in-memory unit tests used to: separate budgets per key,
 * a window that recovers once it has passed, and a sweep that deletes expired
 * windows without ever resetting a live one, even while hits race it.
 *
 *   DATABASE_URL=postgres://... AUTH_SECRET=<32+ chars> bun scripts/ci/rate-limit-drill.ts
 *
 * Expects a migrated database (runs after the other drills in CI). Every key
 * carries a fresh run id, so runs never share a window, and nothing is deleted
 * but expired windows: the drill's own rows age out and go with a later sweep.
 * A limiter that fails open would pass the "allowed" checks and fail the rest.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimit, sweepExpiredWindows } from "@/lib/rate-limit";
import { windowKey } from "@/lib/rate-limit-rules";
import { rateLimitWindow } from "@/schema";

const RUN = randomUUID();
const MINUTE = 60_000;
/** Long enough for a burst to finish inside it, short enough to wait out. */
const SHORT = 200;

const key = (name: string) => `drill:${RUN}:${name}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const allowedOf = async (hits: Promise<boolean>[]) =>
  (await Promise.all(hits)).filter(Boolean).length;

const burst = (k: string, n: number, limit: number, windowMs: number) =>
  Array.from({ length: n }, () => rateLimit(k, limit, windowMs));

const storedCount = async (k: string) => {
  const [row] = await db
    .select({ count: rateLimitWindow.count })
    .from(rateLimitWindow)
    .where(eq(rateLimitWindow.key, windowKey(k)));
  return row?.count;
};

const sweepAll = async (): Promise<number> => {
  const swept = await sweepExpiredWindows(1_000);
  return swept < 1_000 ? swept : swept + (await sweepAll());
};

async function burstAllowsExactlyTheLimit(limit: number): Promise<string | null> {
  const k = key(`burst:${limit}`);
  const allowed = await allowedOf(burst(k, 60, limit, MINUTE));
  const stored = await storedCount(k);
  if (allowed !== limit) return `60 parallel hits, limit ${limit}: ${allowed} allowed`;
  return stored === limit
    ? null
    : `limit ${limit}: the row holds ${stored}, not ${limit}`;
}

async function keysHaveSeparateBudgets(): Promise<string | null> {
  const spent = key("burst:1");
  if (await rateLimit(spent, 1, MINUTE)) return "a spent key allowed another hit";
  return (await rateLimit(key("fresh"), 1, MINUTE))
    ? null
    : "a fresh key was denied because another key was spent";
}

async function windowRecovers(): Promise<string | null> {
  const k = key("recover");
  const first = [
    await rateLimit(k, 2, SHORT),
    await rateLimit(k, 2, SHORT),
    await rateLimit(k, 2, SHORT),
  ];
  if (first.join() !== "true,true,false") return `first window went ${first.join()}`;
  await sleep(SHORT * 2);
  return (await rateLimit(k, 2, SHORT))
    ? null
    : "the budget did not recover after the window";
}

/**
 * The race the sweep is written for: a hit restarting an expired window while
 * sweeps delete expired windows. A sweep that deleted the restarted row would
 * hand out a second fresh budget, and more than `limit` would pass.
 */
async function restartSurvivesRacingSweeps(): Promise<string | null> {
  const k = key("race");
  await allowedOf(burst(k, 3, 3, SHORT));
  await sleep(SHORT * 2);
  const sweeps = Array.from({ length: 10 }, () => sweepExpiredWindows(50));
  const allowed = await allowedOf(burst(k, 40, 3, MINUTE));
  await Promise.all(sweeps);
  return allowed === 3
    ? null
    : `40 hits racing 10 sweeps on an expired window: ${allowed} allowed`;
}

async function sweepTakesOnlyExpiredWindows(): Promise<string | null> {
  const stale = Array.from({ length: 20 }, (_, i) => key(`stale:${i}`));
  const live = key("live");
  await Promise.all(stale.map((k) => rateLimit(k, 1, SHORT / 4)));
  await rateLimit(live, 1, MINUTE);
  await sleep(SHORT);
  await sweepAll();
  const left = (await Promise.all(stale.map(storedCount))).filter((c) => c !== undefined);
  if (left.length > 0) return `${left.length} of 20 expired windows survived the sweep`;
  if ((await storedCount(live)) !== 1) return "the sweep deleted a live window";
  return (await rateLimit(live, 1, MINUTE))
    ? "a live window was reset by the sweep"
    : null;
}

const results = [
  await burstAllowsExactlyTheLimit(1),
  await burstAllowsExactlyTheLimit(7),
  await burstAllowsExactlyTheLimit(25),
  await keysHaveSeparateBudgets(),
  await windowRecovers(),
  await restartSurvivesRacingSweeps(),
  await sweepTakesOnlyExpiredWindows(),
];
const failures = results.filter((f): f is string => f !== null);

for (const f of failures) console.error(`[drill] FAIL: ${f}`);
if (failures.length === 0) {
  console.log(
    "[drill] OK: parallel hits allow exactly the limit, windows recover, and the sweep takes only expired windows",
  );
}
process.exit(failures.length === 0 ? 0 : 1);
