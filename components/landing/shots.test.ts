import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SHOTS, type ShotName, shotImage, shotSrc, stopsOf, zoomSizes } from "./shots";
import { loopBeat } from "./useZoomLoop";

const PUBLIC = join(import.meta.dir, "../../public");
const NAMES = Object.keys(SHOTS) as ShotName[];

describe("the landing pages' screenshots", () => {
  // The src is built from a name with no fallback, so a missing file is a broken image.
  test("every screenshot exists in German and in English", () => {
    const missing = NAMES.flatMap((name) =>
      ["de", "en"]
        .map((lang) => shotSrc(name, lang))
        .filter((src) => !existsSync(join(PUBLIC, src))),
    );
    expect(missing).toEqual([]);
  });

  test("the questionnaire's screenshots lie apart from the walkthrough's", () => {
    expect(shotSrc("reach", "de")).toBe("/images/fragebogen/de-reach.webp");
    expect(shotSrc("explain", "de")).toBe("/images/durchgang/promises/de-explain.webp");
  });

  test("every stop of every zoom aims inside its image and enlarges it", () => {
    const stops = NAMES.flatMap(stopsOf);
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
