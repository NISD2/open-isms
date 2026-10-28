import { expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";
import { BYLINE_LABELS, bylineDate } from "./wiki-byline";

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

test("the day is the calendar day in Berlin, not the server's", () => {
  expect(bylineDate("2026-10-28", "en")).toBe("28 October 2026");
});
