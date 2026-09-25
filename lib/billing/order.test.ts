import { describe, expect, test } from "bun:test";
import { invoiceDates, netCentsFor, priceFor } from "./order";

describe("netCentsFor", () => {
  test("charges a grandfathered account half, everyone else the full price", () => {
    expect(netCentsFor("grandfathered")).toBe(240_000);
    expect(netCentsFor("free")).toBe(480_000);
    expect(netCentsFor("full")).toBe(480_000);
  });
});

describe("priceFor", () => {
  const confirmed = {
    status: "valid",
    countryCode: "NL",
    vatNumber: "000000000B01",
    name: null,
    address: null,
    consultationNumber: null,
    checkedAt: "2026-09-25T10:00:00Z",
  } as const;

  test("adds German VAT for a German customer, on whatever net the account pays", () => {
    const full = priceFor("DE", null, 480_000);
    expect(full).toMatchObject({
      netCents: 480_000,
      vatCents: 91_200,
      grossCents: 571_200,
    });
    const half = priceFor("DE", null, 240_000);
    expect(half).toMatchObject({
      netCents: 240_000,
      vatCents: 45_600,
      grossCents: 285_600,
    });
  });

  test("reverse charges a confirmed EU business and charges VAT when unconfirmed", () => {
    expect(priceFor("NL", confirmed, 480_000)).toMatchObject({
      vatCents: 0,
      grossCents: 480_000,
    });
    expect(
      priceFor("NL", { status: "unavailable", reason: "down" }, 480_000).vatCents,
    ).toBe(91_200);
  });
});

describe("invoiceDates", () => {
  test("dates an order by the calendar day in Berlin, not the server's clock", () => {
    // 00:30 on 25.09 in Berlin is still 24.09 in UTC.
    expect(invoiceDates(new Date("2026-09-24T22:30:00Z")).issueDate).toBe("2026-09-25");
  });

  test("gives thirty days to pay and a service year ending the day before the anniversary", () => {
    expect(invoiceDates(new Date("2026-09-25T10:00:00Z"))).toEqual({
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      performanceStartDate: "2026-09-25",
      performanceEndDate: "2027-09-24",
    });
  });

  test("crosses a year end and a month end cleanly", () => {
    expect(invoiceDates(new Date("2026-12-15T10:00:00Z")).dueDate).toBe("2027-01-14");
    expect(invoiceDates(new Date("2026-01-31T10:00:00Z")).dueDate).toBe("2026-03-02");
  });
});
