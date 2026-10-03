import { describe, expect, test } from "bun:test";
import { WALK } from "./index";
import { placesOf, WALK_REGISTERS } from "./places";

describe("where each register is filled in the walk", () => {
  test("every register the walk writes into has at least one place", () => {
    for (const register of WALK_REGISTERS) {
      expect(placesOf(WALK, register).length).toBeGreaterThan(0);
    }
  });

  test("points at the screen that writes it, in walk order", () => {
    const risks = placesOf(WALK, "risks");
    expect(risks.map((p) => p.code)).toContain("2.3");
    const item = WALK.find((i) => i.code === "2.3");
    const at = risks.find((p) => p.code === "2.3")?.at ?? -1;
    expect(item?.screens[at]?.kind).toBe("rate");
  });

  test("the management review register is filled at 7.3", () => {
    expect(placesOf(WALK, "managementReviews").map((p) => p.code)).toEqual(["7.3"]);
  });
});
