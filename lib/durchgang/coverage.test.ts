/**
 * The walk and the journey stay in step: every NIS 2 requirement is walked or left out with a
 * reason, a left-out one names the walked items that cover it, and walking an item checks it off
 * in the journey. Pure, against the framework data and the same state functions the app uses.
 */
import { describe, expect, test } from "bun:test";
import { JOURNEY_ORDER, journeyState } from "@/lib/compliance/journey-position";
import { type DurchgangEvent, itemState, type StatusRow, WALK } from "./index";
import { COVERED_BY, NOT_WALKED } from "./nis2";

const walked = new Set(WALK.map((item) => item.code));
const notWalked = Object.keys(NOT_WALKED);

describe("every NIS 2 requirement has a place", () => {
  test("the journey knows all 49 requirements", () => {
    expect(JOURNEY_ORDER.length).toBe(49);
  });

  test("every walked item is a NIS 2 requirement", () => {
    for (const code of walked) expect(JOURNEY_ORDER).toContain(code);
  });

  test("every left-out item is a NIS 2 requirement the walk does not also walk", () => {
    for (const code of notWalked) {
      expect(JOURNEY_ORDER).toContain(code);
      expect(walked.has(code)).toBe(false);
    }
  });

  test("no requirement is neither walked nor left out with a reason", () => {
    const gaps = JOURNEY_ORDER.filter(
      (code) => !walked.has(code) && !(code in NOT_WALKED),
    );
    expect(gaps).toEqual([]);
  });

  test("every left-out item says where it is met, or that no statute asks it of every entity", () => {
    expect(Object.keys(COVERED_BY).sort()).toEqual([...notWalked].sort());
  });

  test("an item that is met elsewhere is met by items the walk actually walks", () => {
    for (const [code, by] of Object.entries(COVERED_BY)) {
      for (const target of by ?? []) {
        expect({ code, target, walked: walked.has(target) }).toEqual({
          code,
          target,
          walked: true,
        });
      }
    }
  });
});

describe("walking an item checks it off in the journey", () => {
  const at = new Date("2026-10-03T10:00:00Z");
  const open: StatusRow = { status: "not_started", signedOffAt: null, reviewedAt: null };
  const signed: StatusRow = { status: "completed", signedOffAt: at, reviewedAt: null };
  const event = (action: string, newValue: unknown = null): DurchgangEvent => ({
    action,
    newValue,
    createdAt: at,
  });
  const journeyOf = (row: StatusRow, latest: DurchgangEvent | null) =>
    journeyState(row.status, itemState(row, latest));

  for (const { code } of WALK) {
    test(`${code}: filled in waits for sign-off, signed off is done, set aside is neither`, () => {
      expect(journeyOf(open, null)).toBe("todo");
      expect(journeyOf(open, event("durchgang.item_done"))).toBe("awaiting");
      expect(journeyOf(signed, event("durchgang.item_done"))).toBe("signed");
      const aside = journeyOf(open, event("durchgang.waiting", { reason: "ask" }));
      expect(aside === "awaiting" || aside === "signed").toBe(false);
    });
  }
});
