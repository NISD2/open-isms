import { describe, expect, test } from "bun:test";
import {
  formatWholeEuro,
  invoiceDates,
  invoiceEmailWording,
  invoiceWording,
  netCentsFor,
  periodProblem,
  priceFor,
} from "./order";

describe("formatWholeEuro", () => {
  test("drops the cents a price card does not need, in the locale's own format", () => {
    expect(formatWholeEuro(480_000, "de")).toBe("4.800 €");
    expect(formatWholeEuro(240_000, "en")).toBe("€2,400");
  });
});

describe("netCentsFor", () => {
  test("charges a grandfathered holder half, everyone else the full price", () => {
    expect(netCentsFor(true)).toBe(240_000);
    expect(netCentsFor(false)).toBe(480_000);
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

describe("periodProblem", () => {
  const today = "2026-10-07";

  test("accepts a period running past the year, as agreed after an order", () => {
    expect(periodProblem("2026-10-07", "2027-12-31", today)).toBeNull();
  });

  test("refuses a period that ends before it starts, or has already ended", () => {
    expect(periodProblem("2026-10-07", "2026-10-06", today)).not.toBeNull();
    expect(periodProblem("2025-01-01", "2026-10-06", today)).not.toBeNull();
  });

  test("refuses two years or more, so a typo cannot sell a decade", () => {
    expect(periodProblem("2026-10-07", "2028-10-06", today)).toBeNull();
    expect(periodProblem("2026-10-07", "2028-10-07", today)).not.toBeNull();
    expect(periodProblem("2026-10-07", "2036-12-31", today)).not.toBeNull();
  });
});

describe("a reissued invoice", () => {
  const dates = {
    ...invoiceDates(new Date("2026-10-07T10:00:00Z")),
    performanceEndDate: "2027-12-31",
  };
  const money = priceFor("DE", null, 240_000);

  test("names the invoice it replaces, in the footer and the email", () => {
    const de = invoiceWording(dates, money, "de", true, "NIS-2026-0001");
    expect(de.footer).toContain("ersetzt die stornierte Rechnung NIS-2026-0001");
    expect(de.description).toContain("bis 2027-12-31");
    const email = invoiceEmailWording({
      number: "NIS-2026-0002",
      locale: "en",
      where: { attached: true, invoiceUrl: null },
      termsVersion: null,
      amounts: money,
      dates,
      firstOrder: true,
      replacesNumber: "NIS-2026-0001",
    });
    expect(email.intro.join(" ")).toContain(
      "replaces the canceled invoice NIS-2026-0001",
    );
  });

  test("an ordinary invoice says nothing about replacing", () => {
    expect(invoiceWording(dates, money, "de", true).footer).not.toContain("ersetzt");
  });
});
