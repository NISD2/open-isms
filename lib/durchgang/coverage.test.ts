/**
 * The walk and the journey stay in step: every NIS 2 requirement is walked or left out with a
 * reason, a left-out one names the walked items that cover it, and walking an item checks it off
 * in the journey. Pure, against the framework data and the same state functions the app uses.
 */
import { describe, expect, test } from "bun:test";
import { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import {
  type DotState,
  isDoneState,
  JOURNEY_ORDER,
  journeyState,
} from "@/lib/compliance/journey-position";
import {
  APPROVAL_SCREEN,
  type Covering,
  coveredState,
  type DurchgangEvent,
  itemState,
  type StatusRow,
  WALK,
  walkOf,
} from "./index";
import { COVERED_BY, NOT_WALKED } from "./nis2";

const company = (
  entityType: (typeof entityTypeEnum.enumValues)[number],
  criticalInstallation: "yes" | "no" | "unsettled" = "unsettled",
) => ({ entityType, criticalInstallation });
const codesOf = (facts: ReturnType<typeof company>) => walkOf(facts).map((i) => i.code);

/** What every entity walks: a company that operates no critical facility. */
const everyone = new Set(codesOf(company("important")));
const notWalked = Object.keys(NOT_WALKED);

describe("every NIS 2 requirement has a place", () => {
  test("the journey knows all 49 requirements", () => {
    expect(JOURNEY_ORDER.length).toBe(49);
  });

  test("every walked item is a NIS 2 requirement", () => {
    for (const { code } of WALK) expect(JOURNEY_ORDER).toContain(code);
  });

  test("every left-out item is a NIS 2 requirement not every entity walks", () => {
    for (const code of notWalked) {
      expect(JOURNEY_ORDER).toContain(code);
      expect(everyone.has(code)).toBe(false);
    }
  });

  test("no requirement is neither walked by every entity nor left out with a reason", () => {
    const gaps = JOURNEY_ORDER.filter(
      (code) => !everyone.has(code) && !(code in NOT_WALKED),
    );
    expect(gaps).toEqual([]);
  });

  test("every left-out item says where it is met, or that no statute asks it of every entity", () => {
    expect(Object.keys(COVERED_BY).sort()).toEqual([...notWalked].sort());
  });

  test("an item that is met elsewhere is met by items every entity walks", () => {
    for (const [code, by] of Object.entries(COVERED_BY)) {
      for (const target of by ?? []) {
        expect({ code, target, walked: everyone.has(target) }).toEqual({
          code,
          target,
          walked: true,
        });
      }
    }
  });
});

describe("an item for operators of critical facilities is walked by them only", () => {
  const forSome = WALK.filter((item) => item.onlyFor !== undefined);

  test("operators of critical facilities walk 12.4; nobody else does", () => {
    expect(forSome.map((item) => [item.code, item.onlyFor])).toEqual([
      ["12.4", "kritis"],
    ]);
    expect(codesOf(company("kritis"))).toContain("12.4");
    expect(codesOf(company("essential"))).not.toContain("12.4");
    expect(codesOf(company("important"))).not.toContain("12.4");
  });

  test("a critical facility recorded as such counts, whatever entity type was chosen", () => {
    expect(codesOf(company("essential", "yes"))).toContain("12.4");
    expect(codesOf(company("essential", "no"))).not.toContain("12.4");
  });

  test("everyone else has the reason it is left out", () => {
    for (const { code } of forSome) expect(code in NOT_WALKED).toBe(true);
  });

  test("an operator's walk is every entity's walk plus its own items", () => {
    const own = forSome.map((i) => i.code);
    expect(codesOf(company("kritis")).filter((code) => !own.includes(code))).toEqual([
      ...everyone,
    ]);
  });

  test("in every walk, management approves last", () => {
    for (const type of entityTypeEnum.enumValues) {
      expect(codesOf(company(type)).at(-1)).toBe(APPROVAL_SCREEN?.code);
    }
  });
});

describe("a requirement the walk leaves out shows on the journey where it was met", () => {
  const ordinary = { sector: "energy", walks: [...everyone] };
  const kritis = { sector: "energy", walks: codesOf(company("kritis")) };
  const msp = { sector: "ict_service_management", walks: [...everyone] };
  const states =
    (map: Readonly<Record<string, Covering>>) =>
    (code: string): Covering =>
      map[code] ?? { state: "todo", walked: false };

  test("6.1 is signed off once 6.3 is, filled in through the walk", () => {
    const signed = states({ "6.3": { state: "signed", walked: true } });
    expect(coveredState("6.1", "todo", ordinary, signed)).toEqual({
      state: "signed",
      coveredBy: { kind: "walk", codes: ["6.3"] },
    });
  });

  test("6.1 waits for sign-off while 6.3 does", () => {
    const awaiting = states({ "6.3": { state: "awaiting", walked: true } });
    expect(coveredState("6.1", "todo", ordinary, awaiting).state).toBe("awaiting");
  });

  test("a 6.3 signed on its requirement page, not in the walk, leaves 6.1 its own", () => {
    const page = states({ "6.3": { state: "signed", walked: false } });
    expect(coveredState("6.1", "todo", ordinary, page)).toEqual({
      state: "todo",
      coveredBy: null,
    });
  });

  test("met inside two items, it waits for both", () => {
    const half = states({ "2.3": { state: "signed", walked: true } });
    expect(coveredState("5.3", "todo", ordinary, half).coveredBy).toBeNull();
  });

  test("work on the requirement itself wins", () => {
    const signed = states({ "6.3": { state: "signed", walked: true } });
    for (const own of ["signed", "awaiting", "rejected", "na"] as const) {
      expect(coveredState("6.1", own, ordinary, signed)).toEqual({
        state: own,
        coveredBy: null,
      });
    }
  });

  test("what no statute asks of every entity is not applicable until someone works on it", () => {
    const none = states({});
    expect(coveredState("1.2", "todo", ordinary, none)).toEqual({
      state: "na",
      coveredBy: { kind: "not_required" },
    });
    expect(coveredState("1.2", "started", ordinary, none).state).toBe("started");
  });

  test("the digital providers the CIR binds keep every requirement their own", () => {
    const signed = states({ "6.3": { state: "signed", walked: true } });
    expect(coveredState("6.1", "todo", msp, signed).coveredBy).toBeNull();
    expect(coveredState("1.2", "todo", msp, signed).coveredBy).toBeNull();
  });

  test("12.4 is met in the approval for most, and walked by operators of critical facilities", () => {
    const signed = states({ "7.3": { state: "signed", walked: true } });
    expect(coveredState("12.4", "todo", ordinary, signed).state).toBe("signed");
    expect(coveredState("12.4", "todo", kritis, signed)).toEqual({
      state: "todo",
      coveredBy: null,
    });
  });

  test("once every walk item is signed, nothing on an ordinary company's journey is open", () => {
    for (const company of [ordinary, kritis]) {
      const signed = (code: string): Covering =>
        company.walks.includes(code)
          ? { state: "signed", walked: true }
          : { state: "todo", walked: false };
      const open = JOURNEY_ORDER.filter((code) => {
        const own: DotState = signed(code).state;
        return !isDoneState(coveredState(code, own, company, signed).state);
      });
      expect(open).toEqual([]);
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

  for (const item of WALK) {
    test(`${item.code}: filled in waits for sign-off, signed off is done, set aside is neither`, () => {
      expect(journeyOf(open, null)).toBe("todo");
      expect(journeyOf(open, event("durchgang.item_done"))).toBe("awaiting");
      expect(journeyOf(signed, event("durchgang.item_done"))).toBe("signed");
      const aside = journeyOf(open, event("durchgang.waiting", { reason: "ask" }));
      expect(aside === "awaiting" || aside === "signed").toBe(false);
    });
  }

  test("a decision not to do an item waits for management's signature, like a filled one", () => {
    expect(journeyOf(open, event("durchgang.declined"))).toBe("awaiting");
  });
});

describe("what the law leaves no choice on cannot be decided against", () => {
  test("registration, reporting, management training, the approval and the KRITIS duties", () => {
    const fixed = WALK.filter((item) => item.mustDo !== undefined).map((i) => i.code);
    expect(fixed.toSorted()).toEqual(["1.1", "12.2", "12.3", "12.4", "3.3", "7.3"]);
  });

  test("each says which provision leaves no choice", () => {
    for (const item of WALK) {
      if (item.mustDo !== undefined) expect(item.mustDo).toMatch(/§ \d+/);
    }
  });
});
