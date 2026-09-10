/**
 * Audit F-2 (2026-09-10): the limiter now deletes fully-expired windows so the
 * Map cannot grow forever. These tests pin the part that would be dangerous to
 * get wrong — the sweep must never hand a caller a budget they had already
 * spent, because that turns a memory fix into a fail-open.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { __resetRateLimitState, rateLimit } from "./rate-limit";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

afterEach(() => {
  __resetRateLimitState();
});

describe("rateLimit", () => {
  test("allows up to the limit and denies past it", () => {
    const results = Array.from({ length: 4 }, () => rateLimit("k", 3, 60_000));
    expect(results).toEqual([true, true, true, false]);
  });

  test("keeps separate budgets per key", () => {
    expect(rateLimit("a", 1, 60_000)).toBe(true);
    expect(rateLimit("a", 1, 60_000)).toBe(false);
    expect(rateLimit("b", 1, 60_000)).toBe(true);
  });

  test("lets the budget recover once the window has passed", async () => {
    expect(rateLimit("k", 1, 30)).toBe(true);
    expect(rateLimit("k", 1, 30)).toBe(false);
    await sleep(60);
    expect(rateLimit("k", 1, 30)).toBe(true);
  });

  test("does not reset a live window when other keys churn past the sweep threshold", () => {
    expect(rateLimit("victim", 1, 60_000)).toBe(true);
    expect(rateLimit("victim", 1, 60_000)).toBe(false);

    // Push the Map well past SWEEP_THRESHOLD so the sweep actually runs.
    for (let i = 0; i < 10_050; i++) rateLimit(`churn:${i}`, 1, 60_000);

    // The victim's window is still inside its 60s window, so the sweep must
    // have left it alone and the caller must still be denied.
    expect(rateLimit("victim", 1, 60_000)).toBe(false);
  });

  test("sweeps windows that have fully expired", async () => {
    for (let i = 0; i < 10_050; i++) rateLimit(`stale:${i}`, 1, 20);
    await sleep(60);
    // One more call past the threshold triggers the sweep; the stale windows
    // are all expired by now, so it reclaims them.
    rateLimit("trigger", 1, 60_000);
    expect(rateLimit("stale:0", 1, 20)).toBe(true);
  });
});
