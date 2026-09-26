import { describe, expect, test } from "bun:test";
import { canceledEmailWording, cancelWindow, creditNoteLine } from "./cancel-terms";

describe("cancelWindow", () => {
  const first = { issueDate: "2026-09-01", firstInvoice: true } as const;
  const later = { issueDate: "2026-09-01", firstInvoice: false } as const;

  test("the first invoice: the order day is day 0 and inside the thirty days", () => {
    expect(cancelWindow(first, new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "money_back",
      day: 0,
      lastDay: "2026-10-01",
    });
  });

  test("the first invoice: the thirtieth day is still inside, the next is not", () => {
    expect(cancelWindow(first, new Date("2026-10-01T20:00:00Z")).kind).toBe("money_back");
    expect(cancelWindow(first, new Date("2026-10-02T08:00:00Z"))).toEqual({
      kind: "renewal",
      day: 31,
      reason: "window_passed",
    });
  });

  test("a later invoice never has money back, even on its order day", () => {
    expect(cancelWindow(later, new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "renewal",
      day: 0,
      reason: "not_first_invoice",
    });
    expect(cancelWindow(later, new Date("2026-09-15T10:00:00Z"))).toEqual({
      kind: "renewal",
      day: 14,
      reason: "not_first_invoice",
    });
  });

  test("the day is counted in Berlin, not on the server's clock", () => {
    // 22:30 UTC on the 1st of October is already the 2nd in Berlin.
    expect(cancelWindow(first, new Date("2026-10-01T22:30:00Z")).kind).toBe("renewal");
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
    expect(paid.join(" ")).toContain("innerhalb von 30 Tagen nach der Kündigung");
    expect(unpaid.join(" ")).not.toContain("überweisen");
    // Unpaid in Qonto is not proof that no transfer is on its way.
    expect(unpaid.join(" ")).toContain("innerhalb von 30 Tagen nach ihrem Eingang");
    expect(unpaid.join(" ")).not.toContain("nichts weiter");
  });

  test("a later invoice's renewal cancel says why there is no money back", () => {
    const mail = {
      kind: "renewal",
      invoiceNumber: "RE-2027-0001",
      periodEnd: "2028-08-31",
    } as const;
    const later = canceledEmailWording({ ...mail, reason: "not_first_invoice" }, "de");
    const passed = canceledEmailWording({ ...mail, reason: "window_passed" }, "de");
    expect(later.paragraphs.join(" ")).toContain("nur für die erste Bestellung");
    expect(passed.paragraphs.join(" ")).toContain("sind vorbei");
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
          {
            kind: "renewal",
            invoiceNumber: "RE-2026-0001",
            periodEnd: "2027-08-31",
            reason: "not_first_invoice",
          },
          locale,
        ),
      ];
      for (const t of texts) {
        expect(`${t.subject} ${t.paragraphs.join(" ")}`).not.toContain("—");
      }
    }
  });
});
