/**
 * What an account that has not ordered may walk: each walk's steps up to its own `lastFreeStep`,
 * and setting the company up. Pinned for both walks, and for the portal's list of the pages that
 * open without an order.
 */
import { describe, expect, test } from "bun:test";
import { WALK_FREE_PATHS, WALK_HOME_PATHS } from "@/lib/walkthrough";
import { GDPR_WALK, isFreeStep, NIS2_WALK, SETUP_STEP, WALKS } from "./index";

describe("the free steps of each walk", () => {
  test("every walk's last free step is one of its items", () => {
    for (const walk of Object.values(WALKS)) {
      expect(walk.items.map((i) => i.code)).toContain(walk.lastFreeStep);
    }
  });

  test("a walk is free up to its last free step and closed after it", () => {
    for (const walk of Object.values(WALKS)) {
      const at = walk.items.findIndex((i) => i.code === walk.lastFreeStep);
      for (const [i, item] of walk.items.entries()) {
        expect(isFreeStep(item.code)).toBe(i <= at);
      }
    }
  });

  test("NIS 2 ends at the list of what the company has; GDPR at its record", () => {
    expect(NIS2_WALK.lastFreeStep).toBe("2.2");
    expect(GDPR_WALK.items.slice(0, 2).map((i) => i.code)).toEqual([
      "G-DPO.1",
      "G-ROP.1",
    ]);
    expect(isFreeStep("G-ROP.1")).toBe(true);
    expect(isFreeStep("G-DPA.1")).toBe(false);
  });

  test("setting the company up is free; a code no walk has is not", () => {
    expect(isFreeStep(SETUP_STEP)).toBe(true);
    expect(isFreeStep("not-a-step")).toBe(false);
  });

  test("the portal opens each walk's home and free steps without an order, and nothing past them", () => {
    expect(WALK_HOME_PATHS).toContain("/durchgang/nis2");
    expect(WALK_HOME_PATHS).toContain("/durchgang/dsgvo");
    expect(WALK_HOME_PATHS).toContain("/walkthrough/gdpr");
    expect(WALK_FREE_PATHS).toContain("/durchgang/dsgvo/G-ROP.1");
    expect(WALK_FREE_PATHS).toContain("/walkthrough/nis2/2.2");
    expect(WALK_FREE_PATHS).not.toContain("/durchgang/dsgvo/G-DPA.1");
    expect(WALK_FREE_PATHS).not.toContain("/durchgang/nis2/2.3");
  });
});
