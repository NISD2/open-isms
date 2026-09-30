import { describe, expect, test } from "bun:test";
import { acceptanceNote, declinedNote, noteLine, waitingNote } from "./notes";

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
    expect(acceptanceNote("de", "low", "Weil.")).toContain("„Gering“");
    expect(acceptanceNote("en", "medium", "Because.")).toContain('"Medium"');
  });

  test("keeps the reason for the Geschäftsführung with the proposal", () => {
    expect(acceptanceNote("en", "medium", "We treat high risks first.")).toContain(
      "Reason: We treat high risks first.",
    );
    expect(declinedNote("de", "Kein eigener Server im Haus.")).toContain(
      "Begründung: Kein eigener Server im Haus.",
    );
  });

  test("leaves the note out when there is none", () => {
    expect(waitingNote("de", "Ich muss erst jemanden fragen", null)).toBe(
      "Geht noch nicht: Ich muss erst jemanden fragen.",
    );
  });
});
