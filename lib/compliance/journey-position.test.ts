/**
 * The journey order is the one thing every surface sorts by, so its properties are pinned here.
 *
 * The property that matters most is the one that was missing: a prerequisite precedes what it
 * blocks, even when urgency alone would put them the other way round.
 */

import { describe, expect, test } from "bun:test";
import { NIS2_PREREQUISITES } from "@nisd2/grc-data-model/frameworks";
import { JOURNEY_ORDER, journeyIndex } from "./journey-position";

describe("JOURNEY_ORDER", () => {
  test("holds every requirement exactly once, so nothing is lost to a cycle", () => {
    expect(JOURNEY_ORDER).toHaveLength(49);
    expect(new Set(JOURNEY_ORDER).size).toBe(49);
  });

  test("every prerequisite precedes what it blocks", () => {
    for (const { prerequisite, blocks } of NIS2_PREREQUISITES) {
      expect(journeyIndex(prerequisite)).toBeLessThan(journeyIndex(blocks));
    }
  });

  test("prerequisites override urgency: the risk register comes before accepting residual risks", () => {
    // 2.4 is P0 and 2.3 is P1, so urgency alone put acceptance six steps ahead of the register it
    // says it cannot happen without. This is the pair Simon caught on screen.
    expect(journeyIndex("2.3")).toBeLessThan(journeyIndex("2.4"));
  });

  test("management training precedes everything the statute gates on it", () => {
    for (const code of ["1.3", "1.4", "2.4", "7.3", "8.3"]) {
      expect(journeyIndex("1.1")).toBeLessThan(journeyIndex(code));
    }
  });

  test("where nothing constrains it, urgency still leads", () => {
    // Registration is P0, category 0, and has no prerequisite. It opens the journey.
    expect(JOURNEY_ORDER[0]).toBe("12.1");
  });

  test("an unknown code sorts last rather than throwing, because codes arrive from URLs", () => {
    expect(journeyIndex("99.9")).toBe(Number.POSITIVE_INFINITY);
    expect(["99.9", "3.1"].sort((a, b) => journeyIndex(a) - journeyIndex(b)).at(-1)).toBe(
      "99.9",
    );
  });
});
