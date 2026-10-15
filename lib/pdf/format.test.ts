import { describe, expect, test } from "bun:test";
import { SHOWN_ANSWER_CHARS } from "@/lib/compliance/intake-answers";
import {
  formatDecision,
  formatFieldValue,
  formatReportDate,
  formatSigner,
  getDateLocale,
  pdfLocale,
} from "./format";

describe("pdfLocale", () => {
  test("keeps the languages the documents are written in", () => {
    expect(pdfLocale("de")).toBe("de");
    expect(pdfLocale("cs")).toBe("cs");
    expect(pdfLocale("cs-CZ")).toBe("cs");
    expect(pdfLocale(" DE-at ")).toBe("de");
  });

  test("gives every other reader English", () => {
    expect(pdfLocale("pl")).toBe("en");
    expect(pdfLocale(null)).toBe("en");
    expect(pdfLocale("")).toBe("en");
  });
});

// Rows saved before answers were checked can hold megabytes; react-pdf lays
// out whatever it is given, synchronously, on the one app container.
describe("formatFieldValue", () => {
  test("cuts an oversized stored answer down", () => {
    const rendered = formatFieldValue("x".repeat(9 * 1024 * 1024), "text", "de");
    expect(rendered).toHaveLength(SHOWN_ANSWER_CHARS + 1);
    expect(rendered.endsWith("…")).toBe(true);
  });

  test("cuts an oversized value of any shape, not only strings", () => {
    const rendered = formatFieldValue(Array(200_000).fill("abc"), "text", "en");
    expect(rendered.length).toBeLessThanOrEqual(SHOWN_ANSWER_CHARS + 1);
  });

  test("leaves an ordinary answer as it was", () => {
    expect(formatFieldValue("SIEM_und_EDR", "text", "en")).toBe("SIEM und EDR");
    expect(formatFieldValue(true, "boolean", "de")).toBe("Ja");
    expect(formatFieldValue(4, "number", "de")).toBe("4");
  });

  test("says yes and no in the document's language", () => {
    expect(formatFieldValue(true, "boolean", "cs")).toBe("Ano");
    expect(formatFieldValue(false, "boolean", "cs")).toBe("Ne");
    expect(formatFieldValue(false, "boolean", "pl")).toBe("No");
  });
});

describe("formatSigner", () => {
  test("prints the name with the role in brackets", () => {
    expect(formatSigner("Katrin Albers", "Geschäftsführung")).toBe(
      "Katrin Albers (Geschäftsführung)",
    );
  });

  test("falls back to whichever half exists", () => {
    expect(formatSigner("Katrin Albers", null)).toBe("Katrin Albers");
    expect(formatSigner(null, "Geschäftsführung")).toBe("Geschäftsführung");
    expect(formatSigner("", "IT-Leitung")).toBe("IT-Leitung");
  });

  test("returns null when neither exists", () => {
    expect(formatSigner(null, null)).toBeNull();
  });
});

describe("formatReportDate", () => {
  test("uses the Berlin calendar day, not the server's", () => {
    // 23:30 UTC on 11 September is already 12 September in Berlin.
    const lateEvening = new Date("2026-09-11T23:30:00.000Z");
    expect(formatReportDate(lateEvening, "de")).toBe("12.9.2026");
    expect(formatReportDate(lateEvening, "en")).toBe("12/09/2026");
    expect(formatReportDate(lateEvening, "cs")).toBe("12. 9. 2026");
  });

  test("dates a Czech document as Czech does, and any other as en-GB", () => {
    expect(getDateLocale("cs")).toBe("cs-CZ");
    expect(getDateLocale("fr")).toBe("en-GB");
  });
});

describe("formatDecision", () => {
  const decidedAt = new Date("2026-09-12T08:00:00.000Z");

  test("prints the date and the name", () => {
    expect(formatDecision(decidedAt, "Jonas Pieper", "de")).toBe(
      "12.9.2026, Jonas Pieper",
    );
  });

  test("prints the date alone when no name was recorded", () => {
    expect(formatDecision(decidedAt, null, "de")).toBe("12.9.2026");
  });

  test("returns null when there is nothing to print", () => {
    expect(formatDecision(null, null, "en")).toBeNull();
  });
});
