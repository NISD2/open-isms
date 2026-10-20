import { describe, expect, test } from "bun:test";
import { purchasePath } from "./purchase";

const HOLDER = "11111111-1111-4111-8111-111111111111";
const MANAGER = "22222222-2222-4222-8222-222222222222";
const at = (day: number) => new Date(Date.UTC(2026, 9, day));

const invoiceBy = (
  day: number,
  createdByUserId: string | null,
  source: "self_serve" | "admin" = "self_serve",
) => ({ createdAt: at(day), createdByUserId, source });

describe("purchase path", () => {
  test("counts price lookups and reads who ordered against the account holder", () => {
    const path = purchasePath(
      [
        { at: at(1), action: "billing.quote", userId: HOLDER },
        { at: at(2), action: "billing.quote", userId: HOLDER },
        { at: at(4), action: "billing.place", userId: HOLDER },
      ],
      HOLDER,
      invoiceBy(4, HOLDER),
    );
    expect(path.priceLookups).toBe(2);
    expect(path.orderedBy).toBe("account holder");
    expect(path.daysFromFirstLookupToOrder).toBe(3);
    expect(path.handedUpBeforeOrdering).toBe(false);
  });

  test("a hand-up before the order, and an order by management, is the could-not-sign-alone path", () => {
    const path = purchasePath(
      [
        { at: at(1), action: "team.forwardToManagement", userId: HOLDER },
        { at: at(3), action: "billing.place", userId: MANAGER },
      ],
      HOLDER,
      invoiceBy(3, MANAGER),
    );
    expect(path.handedUpBeforeOrdering).toBe(true);
    expect(path.orderedBy).toBe("someone else (management the holder invited)");
  });

  test("a hand-up with no order yet still counts as handed up", () => {
    const path = purchasePath(
      [{ at: at(1), action: "team.forwardToManagement", userId: HOLDER }],
      HOLDER,
      null,
    );
    expect(path.handedUpBeforeOrdering).toBe(true);
    expect(path.orderedAt).toBeNull();
    expect(path.orderedBy).toBeNull();
  });

  test("a refused or failed order attempt leaves a row but is no order without an invoice", () => {
    const path = purchasePath(
      [
        { at: at(1), action: "billing.place", userId: HOLDER },
        { at: at(2), action: "billing.place", userId: MANAGER },
      ],
      HOLDER,
      null,
    );
    expect(path.orderAttempts).toBe(2);
    expect(path.orderedAt).toBeNull();
    expect(path.orderedBy).toBeNull();
  });

  test("an invoice by someone when the account has no holder on record is not the holder's", () => {
    const path = purchasePath([], null, invoiceBy(1, HOLDER));
    expect(path.orderedBy).toBe("someone else (management the holder invited)");
  });

  test("an invoice whose creator was erased is unknown, not someone else", () => {
    expect(purchasePath([], HOLDER, invoiceBy(1, null)).orderedBy).toBe("unknown");
    expect(purchasePath([], null, invoiceBy(1, null)).orderedBy).toBe("unknown");
  });

  test("an invoice closed by a platform admin says so, whoever created it", () => {
    const path = purchasePath([], HOLDER, invoiceBy(1, HOLDER, "admin"));
    expect(path.orderedBy).toBe("closed by a platform admin");
  });
});
