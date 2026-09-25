import { describe, expect, test } from "bun:test";
import { formatDecision, formatReportDate, formatSigner } from "./format";

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
    expect(formatReportDate(lateEvening, "en")).toBe("9/12/2026");
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
