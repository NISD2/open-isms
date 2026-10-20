import { describe, expect, test } from "bun:test";
import { type BillingFacts, billingStateOf, verdictFor } from "./account-state";

const facts = (over: Partial<BillingFacts>): BillingFacts => ({
  level: "free",
  moneyBack: null,
  ...over,
});

describe("billingStateOf", () => {
  test("a full account inside its thirty days is on trial, after them licensed", () => {
    expect(
      billingStateOf(facts({ level: "full", moneyBack: { lastDay: "2026-11-19" } })),
    ).toEqual({ kind: "trial", lastDay: "2026-11-19" });
    expect(billingStateOf(facts({ level: "full" }))).toEqual({ kind: "licensed" });
  });

  test("grandfathered stays grandfathered; no licence and no company are free", () => {
    expect(billingStateOf(facts({ level: "grandfathered" })).kind).toBe("grandfathered");
    expect(billingStateOf(facts({ level: "free" })).kind).toBe("free");
    expect(billingStateOf(facts({ level: null })).kind).toBe("free");
  });
});

describe("verdictFor", () => {
  test("only the money back of an order asks first, for export and sign-off alike", () => {
    const trial = { kind: "trial", lastDay: "2026-11-19" } as const;
    for (const act of ["export", "sign_off"] as const) {
      expect(verdictFor(trial, act)).toEqual({ kind: "confirm", lastDay: "2026-11-19" });
      for (const kind of ["free", "grandfathered", "licensed"] as const) {
        expect(verdictFor({ kind }, act)).toEqual({ kind: "allow" });
      }
    }
  });
});
