import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SHOTS, shotImage, zoomSizes } from "./shots";

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

  test("every zoom aims inside its image and enlarges it", () => {
    for (const { focus } of Object.values(SHOTS)) {
      expect(focus.x).toBeGreaterThan(0);
      expect(focus.x).toBeLessThan(1);
      expect(focus.y).toBeGreaterThan(0);
      expect(focus.y).toBeLessThan(1);
      expect(focus.scale).toBeGreaterThanOrEqual(1);
    }
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
