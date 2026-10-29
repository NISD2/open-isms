import { expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";
import { BYLINE_LABELS, bylineDate, reviewedLine } from "./wiki-byline";

test("every locale the site serves has all three byline labels", () => {
  for (const code of LOCALE_CODES) {
    const { reviewed, published, continuous, dateTag } = BYLINE_LABELS[code];
    expect([reviewed, published, continuous, dateTag].every((s) => s.length > 0)).toBe(
      true,
    );
  }
});

test("no locale but German shows the German labels", () => {
  const german = BYLINE_LABELS.de;
  const copies = LOCALE_CODES.filter((code) => code !== "de").filter(
    (code) =>
      BYLINE_LABELS[code].reviewed === german.reviewed ||
      BYLINE_LABELS[code].published === german.published ||
      BYLINE_LABELS[code].continuous === german.continuous,
  );
  expect(copies).toEqual([]);
});

test("a date is written in the reader's own language", () => {
  const month = Object.fromEntries(
    LOCALE_CODES.map((code) => [code, bylineDate("2026-05-30", code)]),
  );
  expect(month.de).toContain("Mai");
  expect(month.en).toContain("May");
  expect(month.es).toContain("mayo");
  expect(month.it).toContain("maggio");
  expect(month.fr).toContain("mai");
  expect(month.pl).toContain("maja");
  expect(month.pt).toContain("maio");
  expect(month.nl).toContain("mei");
  expect(month.cs).toContain("května");
});

test("a date-only value is that calendar day", () => {
  expect(bylineDate("2026-10-28", "en")).toBe("28 October 2026");
});

test("the day is the one on a Berlin clock, not the runner's", () => {
  // 23:30 UTC on the 28th is 00:30 on the 29th in Berlin (summer time ended on 25 October, so
  // the offset is +1). A runner on UTC reads this as the 28th unless the zone is named.
  expect(bylineDate("2026-10-28T23:30:00Z", "en")).toBe("29 October 2026");
  // 22:30 UTC on 30 May is 00:30 on the 31st in Berlin (summer time, +2).
  expect(bylineDate("2026-05-30T22:30:00Z", "de")).toBe("31. Mai 2026");
});

test("the reviewed line is the label and the day in the reader's language", () => {
  expect(reviewedLine("2026-10-29", "de")).toBe("Zuletzt geprüft 29. Oktober 2026");
  expect(reviewedLine("2026-10-29", "en")).toBe("Last reviewed 29 October 2026");
  expect(reviewedLine("2026-10-29", "es")).toBe("Última revisión 29 de octubre de 2026");
});
