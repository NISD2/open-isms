import { describe, expect, test } from "bun:test";
import { ALL_ITEMS, GDPR_WALK, NIS2_WALK } from "./index";
import { placesOf, WALK_REGISTERS } from "./places";

const { items: WALK } = NIS2_WALK;

describe("where each register is filled in the walks", () => {
  test("every register a walk writes into has at least one place in some walk", () => {
    for (const register of WALK_REGISTERS) {
      expect({ register, places: placesOf(ALL_ITEMS, register).length > 0 }).toEqual({
        register,
        places: true,
      });
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

  test("the record of processing activities is filled at G-ROP.1, the supplier list in both walks", () => {
    expect(placesOf(GDPR_WALK.items, "processingActivities").map((p) => p.code)).toEqual([
      "G-ROP.1",
    ]);
    expect(placesOf(GDPR_WALK.items, "suppliers").map((p) => p.code)).toEqual([
      "G-DPA.1",
      "G-DPA.2",
    ]);
  });
});
