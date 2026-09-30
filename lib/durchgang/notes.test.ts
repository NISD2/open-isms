import { describe, expect, test } from "bun:test";
import { acceptanceNote, noteLine, waitingNote } from "./notes";

describe("the notes trail", () => {
  test("dates a line by the Berlin calendar day, not the UTC one", () => {
    // 23:30 UTC on 30 September is already 1 October in Berlin (CEST, UTC+2).
    expect(noteLine(new Date("2026-09-30T23:30:00Z"), "x")).toBe("2026-10-01 x");
    expect(noteLine(new Date("2026-12-31T22:59:00Z"), "x")).toBe("2026-12-31 x");
  });

  test("keeps a typed note on one line", () => {
    expect(noteLine(new Date("2026-09-30T10:00:00Z"), "  erste\n\nZeile  ")).toBe(
      "2026-09-30 erste Zeile",
    );
  });

  test("names the accepted level in the reader's language, from the 200-3 table", () => {
    expect(acceptanceNote("de", "low")).toContain("„Gering“");
    expect(acceptanceNote("en", "medium")).toContain('"Medium"');
  });

  test("leaves the note out when there is none", () => {
    expect(waitingNote("de", "Ich muss erst jemanden fragen", null)).toBe(
      "Geht noch nicht: Ich muss erst jemanden fragen.",
    );
  });
});
