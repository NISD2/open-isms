import { describe, expect, test } from "bun:test";
import {
  invoiceNumber,
  isValidInvoicePrefix,
  sandboxInvoiceNumber,
} from "./invoice-number";

describe("isValidInvoicePrefix", () => {
  test("accepts short uppercase letter-and-digit prefixes", () => {
    for (const p of ["RE", "INV", "R2026", "ABCDEFGHIJKL"]) {
      expect(isValidInvoicePrefix(p)).toBe(true);
    }
  });

  test("refuses anything that would split the number or not be typed back", () => {
    for (const p of ["", "re", "NISD2-RE", "RE ", "ABCDEFGHIJKLM", "RÉ"]) {
      expect(isValidInvoicePrefix(p)).toBe(false);
    }
  });
});

describe("invoiceNumber", () => {
  test("pads so numbers sort as text and line up in a column", () => {
    expect(invoiceNumber("RE", 2026, 1)).toBe("RE-2026-0001");
    expect(invoiceNumber("RE", 2026, 42)).toBe("RE-2026-0042");
    expect(invoiceNumber("RE", 2026, 1234)).toBe("RE-2026-1234");
  });
});

describe("the sandbox number", () => {
  test("is shaped like a real one, with the year it is given", () => {
    expect(sandboxInvoiceNumber("RE", 2027, new Date("2026-12-31T23:30:00Z"))).toMatch(
      /^RE-2027-\d{8}$/,
    );
  });

  test("differs for the same time of day on different days", () => {
    expect(sandboxInvoiceNumber("RE", 2026, new Date("2026-09-25T10:00:00Z"))).not.toBe(
      sandboxInvoiceNumber("RE", 2026, new Date("2026-09-26T10:00:00Z")),
    );
  });
});
