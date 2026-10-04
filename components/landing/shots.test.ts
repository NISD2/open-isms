import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SHOTS, type ShotName, shotImage, stopsOf, zoomSizes } from "./shots";
import { loopBeat } from "./useZoomLoop";

const PROMISES = join(import.meta.dir, "../../public/images/durchgang/promises");

describe("the landing page's walkthrough screenshots", () => {
  // The src is built from a name with no fallback, so a missing file is a broken image.
  test("every screenshot exists in German and in English", () => {
    const missing = Object.values(SHOTS).flatMap(({ file }) =>
      ["de", "en"]
        .map((lang) => `${lang}-${file}.webp`)
        .filter((name) => !existsSync(join(PROMISES, name))),
    );
    expect(missing).toEqual([]);
  });

  test("every stop of every zoom aims inside its image and enlarges it", () => {
    const stops = (Object.keys(SHOTS) as ShotName[]).flatMap(stopsOf);
    for (const focus of stops) {
      expect(focus.x).toBeGreaterThan(0);
      expect(focus.x).toBeLessThan(1);
      expect(focus.y).toBeGreaterThan(0);
      expect(focus.y).toBeLessThan(1);
      expect(focus.scale).toBeGreaterThanOrEqual(1);
    }
  });

  test("the hero's path shows its first three steps, then the next three", () => {
    expect(stopsOf("path").map((s) => s.y)).toEqual([0.29, 0.607]);
  });

  test("a language without its own screenshots shows the English ones", () => {
    expect(shotImage("riskMap", "de", "").src).toBe(
      "/images/durchgang/promises/de-risk-map.webp",
    );
    expect(shotImage("riskMap", "nl", "").src).toBe(
      "/images/durchgang/promises/en-risk-map.webp",
    );
  });

  test("the sizes ask for the width the deepest zoom needs", () => {
    expect(zoomSizes("approved", 736)).toBe("(min-width: 1024px) 1472px, 200vw");
  });
});

describe("the zoom loop", () => {
  const beats = (stops: number, rounds: number, count: number) =>
    Array.from({ length: count }, (_, phase) => loopBeat(phase, stops, rounds).stop);

  test("a round shows the screen whole, each stop in turn, then whole again", () => {
    const whole = null;
    expect(beats(2, Number.POSITIVE_INFINITY, 9)).toEqual([
      whole,
      0,
      1,
      whole,
      whole,
      0,
      1,
      whole,
      whole,
    ]);
  });

  test("after its last round it rests whole and stops moving on", () => {
    const length = 2 + 2;
    expect(loopBeat(5 * length - 1, 2, 5)).toEqual({ stop: null, wait: 1400 });
    expect(loopBeat(5 * length, 2, 5)).toEqual({ stop: null, wait: null });
  });
});
