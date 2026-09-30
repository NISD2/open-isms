/**
 * The limiter counts in Postgres. What these tests used to check in memory (a
 * budget per key, the window recovering, cleanup never dropping a live window)
 * is now a property of SQL statements under concurrency, so it is drilled
 * against a real database in scripts/ci/rate-limit-drill.ts.
 *
 * What stays here needs no database: which key and budget a request counts
 * against, and what each process does around the shared count (createLimiter),
 * pinned against an in-memory count with the same contract. That every caller
 * awaits the answer is lib/rate-limit-callers.test.ts.
 */
import { describe, expect, test } from "bun:test";
import {
  type CountHit,
  createLimiter,
  type LimiterOptions,
  publicRouteBudget,
  windowKey,
} from "./rate-limit-rules";

describe("windowKey", () => {
  test("is stable for one key and differs between keys", () => {
    expect(windowKey("login:email:a@example.test")).toBe(
      windowKey("login:email:a@example.test"),
    );
    expect(windowKey("login:email:a@example.test")).not.toBe(
      windowKey("login:email:b@example.test"),
    );
  });

  test("stores 64 characters and none of the key", () => {
    const stored = windowKey(`gap-share:${"t".repeat(500)}`);
    expect(stored).toHaveLength(64);
    expect(stored).not.toContain("gap-share");
    expect(stored).not.toContain("ttt");
  });
});

describe("publicRouteBudget", () => {
  test("a caller with an IP gets its own per-minute budget", () => {
    expect(publicRouteBudget("questionnaire:pdf", "203.0.113.7", 10)).toEqual({
      key: "questionnaire:pdf:203.0.113.7",
      limit: 10,
      windowMs: 60_000,
    });
  });

  test("callers without an IP share one bucket twelve times the size", () => {
    expect(publicRouteBudget("questionnaire:pdf", "unknown", 10)).toEqual({
      key: "questionnaire:pdf:no-client-ip",
      limit: 120,
      windowMs: 60_000,
    });
  });

  test("each route keeps its own shared bucket", () => {
    expect(publicRouteBudget("questionnaire:pdf", "unknown", 10).key).not.toBe(
      publicRouteBudget("questionnaire:docx", "unknown", 10).key,
    );
  });
});

/**
 * A fixed-window count in memory with the database half's contract, on a clock
 * the test moves. It records every call, and how many were in flight at once.
 */
function sharedCount() {
  const clock = { now: 0 };
  const windows = new Map<string, { count: number; resetAt: number }>();
  const calls: string[] = [];
  const load = { inFlight: 0, peak: 0 };
  const countHit: CountHit = async (rowKey, limit, windowMs) => {
    calls.push(rowKey);
    load.inFlight += 1;
    load.peak = Math.max(load.peak, load.inFlight);
    await new Promise((resolve) => setTimeout(resolve, 1));
    load.inFlight -= 1;
    const open = windows.get(rowKey);
    if (open === undefined || open.resetAt <= clock.now) {
      windows.set(rowKey, { count: 1, resetAt: clock.now + windowMs });
      return { allowed: true };
    }
    if (open.count < limit) {
      open.count += 1;
      return { allowed: true };
    }
    return { allowed: false, resetInMs: open.resetAt - clock.now };
  };
  return { clock, calls, load, countHit };
}

const limiterOn = (
  shared: ReturnType<typeof sharedCount>,
  options: Partial<LimiterOptions> = {},
) =>
  createLimiter({
    countHit: shared.countHit,
    now: () => shared.clock.now,
    logOutage: () => {},
    ...options,
  });

describe("createLimiter around the shared count", () => {
  test("a burst at one key asks once per allowed hit, once for the denial, one at a time", async () => {
    const shared = sharedCount();
    const limit = limiterOn(shared);
    const results = await Promise.all(
      Array.from({ length: 200 }, () => limit("k", 5, 1_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
    expect(shared.calls).toHaveLength(6);
    expect(shared.load.peak).toBe(1);
  });

  test("a remembered denial is answered without asking, until the window resets", async () => {
    const shared = sharedCount();
    const limit = limiterOn(shared);
    expect(await limit("k", 1, 1_000)).toBe(true);
    expect(await limit("k", 1, 1_000)).toBe(false);
    expect(await limit("k", 1, 1_000)).toBe(false);
    expect(shared.calls).toHaveLength(2);

    shared.clock.now = 1_000;
    expect(await limit("k", 1, 1_000)).toBe(true);
    expect(shared.calls).toHaveLength(3);
  });

  test("a denial covers the limit it was made for and smaller ones, not larger", async () => {
    const shared = sharedCount();
    const limit = limiterOn(shared);
    await limit("k", 1, 1_000);
    await limit("k", 1, 1_000);
    expect(shared.calls).toHaveLength(2);
    expect(await limit("k", 1, 1_000)).toBe(false);
    expect(shared.calls).toHaveLength(2);
    expect(await limit("k", 5, 1_000)).toBe(true);
    expect(shared.calls).toHaveLength(3);
  });

  test("keys keep separate memories", async () => {
    const shared = sharedCount();
    const limit = limiterOn(shared);
    await limit("a", 1, 1_000);
    expect(await limit("a", 1, 1_000)).toBe(false);
    expect(await limit("b", 1, 1_000)).toBe(true);
  });

  test("the memory is capped, and a forgotten denial is still denied by the count", async () => {
    const shared = sharedCount();
    const limit = limiterOn(shared, { maxDenials: 2 });
    for (const key of ["a", "b", "c"]) {
      await limit(key, 1, 1_000);
      await limit(key, 1, 1_000);
    }
    expect(shared.calls).toHaveLength(6);
    // "a" was the oldest and made room for "c": asked again, and still denied.
    expect(await limit("a", 1, 1_000)).toBe(false);
    expect(shared.calls).toHaveLength(7);
    expect(await limit("c", 1, 1_000)).toBe(false);
    expect(shared.calls).toHaveLength(7);
  });

  test("no answer in time is an outage: allowed, logged once, not asked again until the backoff ends", async () => {
    const shared = sharedCount();
    const outages: unknown[] = [];
    const asked: string[] = [];
    const limit = limiterOn(shared, {
      countHit: (rowKey) => {
        asked.push(rowKey);
        return new Promise(() => {});
      },
      timeoutMs: 20,
      outageBackoffMs: 5_000,
      logOutage: (error) => outages.push(error),
    });
    const results = await Promise.all(
      Array.from({ length: 10 }, () => limit("k", 1, 1_000)),
    );
    expect(results.every(Boolean)).toBe(true);
    expect(asked).toHaveLength(1);
    expect(outages).toHaveLength(1);

    shared.clock.now = 4_999;
    expect(await limit("other", 1, 1_000)).toBe(true);
    expect(asked).toHaveLength(1);

    shared.clock.now = 5_000;
    expect(await limit("other", 1, 1_000)).toBe(true);
    expect(asked).toHaveLength(2);
    expect(outages).toHaveLength(2);
  });

  test("an error is an outage too, and remembered denials still hold through it", async () => {
    const shared = sharedCount();
    const broken = { now: false };
    const outages: unknown[] = [];
    const limit = limiterOn(shared, {
      countHit: (rowKey, max, windowMs) =>
        broken.now
          ? Promise.reject(new Error("connection refused"))
          : shared.countHit(rowKey, max, windowMs),
      logOutage: (error) => outages.push(error),
    });
    await limit("spent", 1, 1_000);
    expect(await limit("spent", 1, 1_000)).toBe(false);

    broken.now = true;
    expect(await limit("fresh", 1, 1_000)).toBe(true);
    expect(outages).toHaveLength(1);
    expect(await limit("spent", 1, 1_000)).toBe(false);
  });
});
