import { describe, expect, test } from "bun:test";
import { canceledEmailWording, cancelWindow, creditNoteLine } from "./cancel-terms";

describe("cancelWindow", () => {
  test("the order day is day 0 and inside the thirty days", () => {
    expect(cancelWindow("2026-09-01", new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "money_back",
      day: 0,
      lastDay: "2026-10-01",
    });
  });

  test("the thirtieth day after the order is still inside, the next is not", () => {
    expect(cancelWindow("2026-09-01", new Date("2026-10-01T20:00:00Z")).kind).toBe(
      "money_back",
    );
    expect(cancelWindow("2026-09-01", new Date("2026-10-02T08:00:00Z"))).toEqual({
      kind: "renewal",
      day: 31,
    });
  });

  test("the day is counted in Berlin, not on the server's clock", () => {
    // 22:30 UTC on the 1st of October is already the 2nd in Berlin.
    expect(cancelWindow("2026-09-01", new Date("2026-10-01T22:30:00Z")).kind).toBe(
      "renewal",
    );
  });
});

describe("creditNoteLine", () => {
  const invoice = {
    number: "RE-2026-0001",
    netCents: 480_000,
    vatCents: 91_200,
    periodStart: "2026-09-01",
    periodEnd: "2027-08-31",
  };

  test("credits the whole net at the rate the invoice was issued with", () => {
    const line = creditNoteLine(invoice, "de");
    expect(line.unitPrice).toEqual({ value: "4800.00", currency: "EUR" });
    expect(line.vatRate).toBe("0.19");
    expect(line.quantity).toBe("1");
  });

  test("a reverse charged invoice is credited without VAT", () => {
    expect(creditNoteLine({ ...invoice, vatCents: 0 }, "en").vatRate).toBe("0.00");
  });
});

describe("canceledEmailWording", () => {
  test("says a refund is coming only when the invoice was paid", () => {
    const base = {
      kind: "money_back",
      invoiceNumber: "RE-2026-0001",
      creditNoteNumber: "GS-2026-0001",
      attached: true,
    } as const;
    const paid = canceledEmailWording({ ...base, refundOwed: true }, "de").paragraphs;
    const unpaid = canceledEmailWording({ ...base, refundOwed: false }, "de").paragraphs;
    expect(paid.join(" ")).toContain("überweisen");
    expect(unpaid.join(" ")).not.toContain("überweisen");
  });

  test("carries no em dash in any language", () => {
    for (const locale of ["de", "en", "nl"] as const) {
      const texts = [
        canceledEmailWording(
          {
            kind: "money_back",
            invoiceNumber: "RE-2026-0001",
            creditNoteNumber: "GS-2026-0001",
            refundOwed: true,
            attached: false,
          },
          locale,
        ),
        canceledEmailWording(
          { kind: "renewal", invoiceNumber: "RE-2026-0001", periodEnd: "2027-08-31" },
          locale,
        ),
      ];
      for (const t of texts) {
        expect(`${t.subject} ${t.paragraphs.join(" ")}`).not.toContain("—");
      }
    }
  });
});
