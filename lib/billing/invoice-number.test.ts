import { describe, expect, test } from "bun:test";
import {
  findInvoiceNumberInReference,
  INVOICE_PREFIX,
  invoiceNumber,
  parseInvoiceNumber,
  sandboxInvoiceNumber,
} from "./invoice-number";

describe("invoiceNumber", () => {
  test("pads so numbers sort as text and line up in a column", () => {
    expect(invoiceNumber(2026, 1, "RE")).toBe("RE-2026-0001");
    expect(invoiceNumber(2026, 42, "RE")).toBe("RE-2026-0042");
    expect(invoiceNumber(2026, 1234, "RE")).toBe("RE-2026-1234");
  });

  test("defaults to the RE prefix, which Qonto recognises for automatic matching", () => {
    if (process.env.INVOICE_PREFIX === undefined) {
      expect(INVOICE_PREFIX).toBe("RE");
    }
  });
});

describe("matching an incoming payment to an invoice", () => {
  test("finds the number inside whatever the payer typed", () => {
    // This is the whole point: the reference field is free text and people add their own words.
    for (const ref of [
      "RE-2026-0042",
      "Rechnung RE-2026-0042",
      "ZAHLUNG RE-2026-0042 KD 88231",
      "re-2026-0042",
    ]) {
      expect(findInvoiceNumberInReference(ref)).toBe("RE-2026-0042");
    }
  });

  test("keeps the digits exactly as the payer typed them", () => {
    expect(findInvoiceNumberInReference("Zahlung RE-2026-00042")).toBe("RE-2026-00042");
    expect(findInvoiceNumberInReference("re-2026-12345678")).toBe("RE-2026-12345678");
  });

  test("returns null when the payer left no reference we can use", () => {
    for (const ref of ["", "Ueberweisung", "Rechnung September", "2026-0042"]) {
      expect(findInvoiceNumberInReference(ref)).toBeNull();
    }
  });

  test("round-trips", () => {
    const n = invoiceNumber(2026, 7, "RE");
    expect(parseInvoiceNumber(n)).toEqual({ prefix: "RE", year: 2026, sequence: 7 });
  });
});

describe("the sandbox number", () => {
  test("is shaped like a real one and parses back", () => {
    const n = sandboxInvoiceNumber(new Date("2026-09-24T21:40:24Z"));
    expect(parseInvoiceNumber(n)).not.toBeNull();
    expect(n.startsWith(`${INVOICE_PREFIX}-2026-`)).toBe(true);
  });

  test("differs for the same time of day on different days", () => {
    expect(sandboxInvoiceNumber(new Date("2026-09-25T10:00:00Z"))).not.toBe(
      sandboxInvoiceNumber(new Date("2026-09-26T10:00:00Z")),
    );
  });
});
