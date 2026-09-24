import { describe, expect, test } from "bun:test";
import {
  findInvoiceNumberInReference,
  invoiceNumber,
  parseInvoiceNumber,
  sandboxInvoiceNumber,
} from "./invoice-number";

describe("invoiceNumber", () => {
  test("pads so numbers sort as text and line up in a column", () => {
    expect(invoiceNumber(2026, 1)).toBe("NISD2-2026-0001");
    expect(invoiceNumber(2026, 42)).toBe("NISD2-2026-0042");
    expect(invoiceNumber(2026, 1234)).toBe("NISD2-2026-1234");
  });
});

describe("matching an incoming payment to an invoice", () => {
  test("finds the number inside whatever the payer typed", () => {
    // This is the whole point: the reference field is free text and people add their own words.
    for (const ref of [
      "NISD2-2026-0042",
      "Rechnung NISD2-2026-0042",
      "ZAHLUNG RE NISD2-2026-0042 KD 88231",
      "nisd2-2026-0042",
    ]) {
      expect(findInvoiceNumberInReference(ref)).toBe("NISD2-2026-0042");
    }
  });

  test("returns null when the payer left no reference we can use", () => {
    for (const ref of ["", "Ueberweisung", "Rechnung September", "2026-0042"]) {
      expect(findInvoiceNumberInReference(ref)).toBeNull();
    }
  });

  test("round-trips", () => {
    const n = invoiceNumber(2026, 7);
    expect(parseInvoiceNumber(n)).toEqual({ prefix: "NISD2", year: 2026, sequence: 7 });
  });
});

describe("the sandbox number", () => {
  test("is shaped like a real one and parses back", () => {
    const n = sandboxInvoiceNumber(new Date("2026-09-24T21:40:24Z"));
    expect(parseInvoiceNumber(n)).not.toBeNull();
    expect(n.startsWith("NISD2-2026-")).toBe(true);
  });
});
