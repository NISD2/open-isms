import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { itemKey, WALK } from "@/lib/durchgang";
import { ITEM_SHOTS, itemShot } from "./itemShots";

const ITEMS = join(import.meta.dir, "../../public/images/durchgang/items");

describe("the locked home's step screenshots", () => {
  test("every step of the walk has one", () => {
    expect(WALK.map((item) => item.code).filter((code) => !ITEM_SHOTS[code])).toEqual([]);
  });

  // The src is built from the code with no fallback, so a missing file is a broken image.
  test("every screenshot exists in German and in English", () => {
    const missing = Object.keys(ITEM_SHOTS).flatMap((code) =>
      ["de", "en"]
        .map((lang) => `${lang}-${itemKey(code)}.webp`)
        .filter((name) => !existsSync(join(ITEMS, name))),
    );
    expect(missing).toEqual([]);
  });

  test("every zoom, in each language, aims inside its image and enlarges it", () => {
    const foci = Object.values(ITEM_SHOTS).flatMap((shot) =>
      shot ? [shot.de, shot.en] : [],
    );
    expect(foci).toHaveLength(2 * Object.keys(ITEM_SHOTS).length);
    for (const focus of foci) {
      expect(focus.x).toBeGreaterThan(0);
      expect(focus.x).toBeLessThan(1);
      expect(focus.y).toBeGreaterThan(0);
      expect(focus.y).toBeLessThan(1);
      expect(focus.scale).toBeGreaterThanOrEqual(1);
    }
  });

  test("a language without its own screenshots shows the English ones, zoomed as in English", () => {
    expect(itemShot("7.3", "de", "")?.src).toBe("/images/durchgang/items/de-7_3.webp");
    expect(itemShot("7.3", "nl", "")?.src).toBe("/images/durchgang/items/en-7_3.webp");
    expect(itemShot("7.3", "nl", "")?.focus).toEqual(ITEM_SHOTS["7.3"]?.en);
  });

  test("a step without a screenshot shows no preview", () => {
    expect(itemShot("0.0", "de", "")).toBeNull();
  });
});
