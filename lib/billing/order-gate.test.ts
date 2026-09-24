/**
 * The rule under test: nothing a third party says or fails to say can stop an order.
 *
 * These are written as the question a person would ask, because the answers are commercial
 * decisions rather than implementation details, and someone changing this file later should see
 * what they are about to break.
 */
import { describe, expect, test } from "bun:test";
import { gateFromInput, orderGate } from "./order-gate";
import { checkStructure } from "./vat-checksum";
import type { VatCheck } from "./vies";

const SOUND = checkStructure("DE", "462889433");
const TYPO = checkStructure("DE", "462889434");

const valid: VatCheck = {
  status: "valid",
  countryCode: "DE",
  vatNumber: "462889433",
  name: null,
  address: null,
  consultationNumber: "WAPIAAAAaDVL-xnd",
  checkedAt: "2026-09-24T21:00:00.000Z",
};
const invalid: VatCheck = {
  status: "invalid",
  countryCode: "DE",
  vatNumber: "462889433",
  checkedAt: "2026-09-24T21:00:00.000Z",
};
const down: VatCheck = { status: "unavailable", reason: "MS_UNAVAILABLE" };

describe("can the customer still order when the EU register is down?", () => {
  test("yes, and silently", () => {
    const g = orderGate(SOUND, down);
    expect(g.proceed).toBe(true);
    // No warning on purpose: a government backend being down at ten at night is not their
    // problem, and saying so only creates doubt at the moment they are deciding to pay.
    expect(g.warning).toBeNull();
  });

  test("yes, for every shape of outage, not just the one we happened to see", () => {
    const outages: readonly VatCheck[] = [
      { status: "unavailable", reason: "MS_UNAVAILABLE" },
      { status: "unavailable", reason: "HTTP 503" },
      { status: "unavailable", reason: "network down" },
      { status: "unavailable", reason: "timeout" },
      { status: "unavailable", reason: "GLOBAL_MAX_CONCURRENT_REQ" },
    ];
    for (const o of outages) expect(orderGate(SOUND, o).proceed).toBe(true);
  });

  test("yes, when the check has not run at all yet", () => {
    expect(orderGate(SOUND, null).proceed).toBe(true);
  });
});

describe("can they order when the register says the number is not known?", () => {
  test("yes, with a warning that does not accuse them", () => {
    const g = orderGate(SOUND, invalid);
    expect(g.proceed).toBe(true);
    expect(g.warning).not.toBeNull();
    // A newly issued number takes weeks to appear. Refusing the sale on a third party's opinion
    // is the same failure as blocking on an outage, with better manners.
    expect(g.warning?.toLowerCase()).not.toContain("invalid");
    expect(g.warning?.toLowerCase()).not.toContain("wrong");
    expect(g.warning).toContain("not held up");
  });
});

describe("what does stop the form?", () => {
  test("only the offline check digit, and only because the number cannot be right", () => {
    const g = orderGate(TYPO, null);
    expect(g.proceed).toBe(false);
    expect(g.warning).toContain("digit wrong");
  });

  test("a typo stops it even when the register happens to be reachable and agreeable", () => {
    // The offline result is authoritative for the form. Nothing VIES says can override a number
    // that fails its own check digit, because such a number cannot be the customer's.
    expect(orderGate(TYPO, valid).proceed).toBe(false);
    expect(orderGate(TYPO, down).proceed).toBe(false);
    expect(orderGate(TYPO, invalid).proceed).toBe(false);
  });

  test("a wrong shape is caught before any arithmetic", () => {
    expect(gateFromInput("DE", "123", null).proceed).toBe(false);
    expect(gateFromInput("XX", "123456789", null).proceed).toBe(false);
  });
});

describe("the whole space, so no combination can quietly block a sale", () => {
  test("a structurally sound number always proceeds, whatever the registry did", () => {
    const registries: readonly (VatCheck | null)[] = [
      valid,
      invalid,
      down,
      { status: "malformed" },
      null,
    ];
    for (const r of registries) {
      const g = orderGate(SOUND, r);
      expect(g.proceed).toBe(true);
    }
  });

  test("proceed:false is reachable only from a failed offline check", () => {
    const registries: readonly (VatCheck | null)[] = [valid, invalid, down, null];
    const blocked = registries.filter((r) => !orderGate(SOUND, r).proceed);
    expect(blocked).toEqual([]);
  });
});
