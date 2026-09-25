import { describe, expect, test } from "bun:test";
import { invoiceDates } from "./order";

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
