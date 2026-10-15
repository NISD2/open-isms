import { describe, expect, test } from "bun:test";
import { duration, percentChange, trafficTiles } from "./traffic-tiles";

// Synthetic totals for a window and the one before it, shaped like a real case: visits grow far
// faster than the visits that read past the first page.
const stats = {
  visits: 5657,
  bounces: 4231,
  pageviews: 14956,
  totaltime: 848323,
  previous: { visits: 3715, bounces: 2649, pageviews: 11188, totaltime: 556330 },
};

describe("trafficTiles", () => {
  test("engaged visits are the visits that viewed more than one page", () => {
    const { now, previous } = trafficTiles(stats);
    expect(now.engaged).toBe(1426);
    expect(previous?.engaged).toBe(1066);
  });

  test("per-visit figures and the single-page share", () => {
    const { now } = trafficTiles(stats);
    expect(now.pagesPerVisit).toBeCloseTo(2.64, 2);
    expect(now.secondsPerVisit).toBeCloseTo(149.96, 1);
    expect(now.singlePageShare).toBeCloseTo(0.748, 3);
  });

  test("the headline grows more slowly than the visits behind it, which is the point", () => {
    const { now, previous } = trafficTiles(stats);
    expect(percentChange(now.visits, previous?.visits ?? null)).toBe(52);
    expect(percentChange(now.engaged, previous?.engaged ?? null)).toBe(34);
  });

  test("no previous window, no visits: nothing is invented", () => {
    const empty = trafficTiles({
      visits: 0,
      bounces: 0,
      pageviews: 0,
      totaltime: 0,
      previous: null,
    });
    expect(empty.previous).toBeNull();
    expect(empty.now).toEqual({
      engaged: 0,
      visits: 0,
      pagesPerVisit: null,
      secondsPerVisit: null,
      singlePageShare: null,
    });
  });
});

describe("percentChange", () => {
  test("rounds to whole percent and is null without a base", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(66, 100)).toBe(-34);
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(null, 10)).toBeNull();
    expect(percentChange(10, null)).toBeNull();
  });
});

describe("duration", () => {
  test("minutes and zero-padded seconds, or seconds alone", () => {
    expect(duration(150)).toBe("2m 30s");
    expect(duration(61)).toBe("1m 01s");
    expect(duration(45)).toBe("45s");
    expect(duration(0)).toBe("0s");
  });
});
