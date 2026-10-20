import { describe, expect, test } from "bun:test";
import { type BillingFacts, billingStateOf, verdictFor } from "./account-state";

const facts = (over: Partial<BillingFacts>): BillingFacts => ({
  level: "free",
  moneyBack: null,
  everPaid: false,
  ...over,
});

describe("billingStateOf", () => {
  test("a full account inside its thirty days is on trial, after them licensed", () => {
    expect(
      billingStateOf(facts({ level: "full", moneyBack: { lastDay: "2026-11-19" } })),
    ).toEqual({ kind: "trial", lastDay: "2026-11-19" });
    expect(billingStateOf(facts({ level: "full" }))).toEqual({ kind: "licensed" });
  });

  test("grandfathered stays grandfathered, paid or not", () => {
    expect(billingStateOf(facts({ level: "grandfathered" })).kind).toBe("grandfathered");
    expect(billingStateOf(facts({ level: "grandfathered", everPaid: true })).kind).toBe(
      "grandfathered",
    );
  });

  test("without a licence, having paid once keeps the account lapsed rather than free", () => {
    expect(billingStateOf(facts({ level: "free" })).kind).toBe("free");
    expect(billingStateOf(facts({ level: "free", everPaid: true })).kind).toBe("lapsed");
    expect(billingStateOf(facts({ level: null })).kind).toBe("free");
  });
});

describe("verdictFor", () => {
  const cases = [
    ["free", "order", "order"],
    ["grandfathered", "allow", "allow"],
    ["trial", "confirm", "confirm"],
    ["licensed", "allow", "allow"],
    ["lapsed", "allow", "order"],
  ] as const;

  for (const [kind, onExport, onSignOff] of cases) {
    test(`${kind}: export ${onExport}, sign-off ${onSignOff}`, () => {
      const state =
        kind === "trial"
          ? ({ kind, lastDay: "2026-11-19" } as const)
          : ({ kind } as const);
      expect(verdictFor(state, "export").kind).toBe(onExport);
      expect(verdictFor(state, "sign_off").kind).toBe(onSignOff);
    });
  }

  test("a confirm names the day the money back would have ended", () => {
    expect(verdictFor({ kind: "trial", lastDay: "2026-11-19" }, "export")).toEqual({
      kind: "confirm",
      lastDay: "2026-11-19",
    });
  });
});
