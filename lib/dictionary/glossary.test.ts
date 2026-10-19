import { describe, expect, test } from "bun:test";
import type { DictionaryTerm } from "@/lib/training/schemas";
import { getGlossary, getTermEntry, glossaryByLetter, isInGlossary } from "./glossary";
import { getMergedDictionary } from "./index";
import { getTermUses, type TermUse, taughtIn } from "./usage";

const term = (overrides: Partial<DictionaryTerm>): DictionaryTerm => ({
  term: "Example",
  type: "defined",
  definition: { en: "An example." },
  ...overrides,
});

describe("which terms the glossary lists", () => {
  test("lists a defined term and leaves a vocabulary word out", () => {
    expect(isInGlossary(term({ type: "defined" }))).toBe(true);
    expect(isInGlossary(term({ type: "vocabulary" }))).toBe(false);
  });

  test("lets a promoted vocabulary term in and a demoted defined term out", () => {
    expect(isInGlossary(term({ type: "vocabulary", inGlossary: true }))).toBe(true);
    expect(isInGlossary(term({ type: "defined", inGlossary: false }))).toBe(false);
  });

  test("keeps plain reading aids off the public page", () => {
    const listed = new Set(getGlossary("en").map((entry) => entry.term));
    expect(listed.has("Yardstick")).toBe(false);
    expect(listed.has("Management body")).toBe(true);
    expect(listed.has("SBOM")).toBe(true);
  });
});

describe("the glossary and the hover definitions", () => {
  test.each(["en", "de"] as const)("never disagree about a definition (%s)", (locale) => {
    const hover = getMergedDictionary(locale);
    for (const entry of getGlossary(locale)) {
      expect(hover.get(entry.term.toLowerCase())?.definition).toBe(entry.definition);
    }
  });

  test("list every term once", () => {
    const terms = getGlossary("en").map((entry) => entry.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    const slugs = getGlossary("en").map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("the A to Z index", () => {
  test("files a German name under its own letter and points at the English entry", () => {
    const g = glossaryByLetter("de").find(({ letter }) => letter === "G");
    const see = g?.rows.find(
      (row) => row.kind === "see" && row.label === "Geschäftsleitung",
    );
    expect(see?.entry.term).toBe("Management body");
  });

  test("has every entry exactly once, and letters in order with symbols first", () => {
    const letters = glossaryByLetter("en");
    const entryRows = letters.flatMap(({ rows }) =>
      rows.filter((row) => row.kind === "entry"),
    );
    expect(entryRows.length).toBe(getGlossary("en").length);
    const plain = letters.map(({ letter }) => letter).filter((letter) => letter !== "#");
    expect(plain).toEqual([...plain].sort());
    expect(letters[0]?.letter).toBe("#");
  });
});

describe("one dictionary term, as the walkthrough's rail reads it", () => {
  test("is found whether or not the glossary lists it, in the reader's language", () => {
    const listed = new Set(getGlossary("en").map((entry) => entry.term));
    expect(listed.has("Yardstick")).toBe(false);
    expect(getTermEntry("Yardstick", "en")?.definition).toBeTruthy();
    expect(getTermEntry("management body", "de")?.term).toBe("Management body");
    expect(getTermEntry("Management body", "de")?.definition).not.toBe(
      getTermEntry("Management body", "en")?.definition,
    );
  });

  test("carries the provision it rests on and says nothing for an unknown term", () => {
    expect(getTermEntry("Essential entity", "en")?.legalRef).toContain("BSIG");
    expect(getTermEntry("no such term", "en")).toBeUndefined();
  });
});

describe("where a term is used in the courses", () => {
  test("quotes the lesson sentence as the learner reads it, without markers", async () => {
    const uses = await getTermUses("en");
    const management = uses.get("management body") ?? [];
    expect(management.length).toBeGreaterThan(0);
    for (const use of management) {
      expect(use.sentence).not.toContain("[[");
      expect(use.sentence.length).toBeGreaterThan(0);
    }
  });

  const use = (overrides: Partial<TermUse>): TermUse => ({
    courseId: "nis2-ceo",
    courseTitle: "Course",
    lessonId: "1.1",
    lessonTitle: "Lesson",
    sentence: "A sentence.",
    mentions: 1,
    ...overrides,
  });

  test("quotes the lesson that marks the term most often", () => {
    const picked = taughtIn([
      use({ lessonId: "1.1" }),
      use({ lessonId: "2.4", mentions: 3 }),
    ]);
    expect(picked?.lessonId).toBe("2.4");
  });

  test("prefers a real lesson to the course intro, and falls back to the intro", () => {
    expect(taughtIn([use({ lessonId: "0.1" }), use({ lessonId: "1.5" })])?.lessonId).toBe(
      "1.5",
    );
    expect(taughtIn([use({ lessonId: "0.1" })])?.lessonId).toBe("0.1");
    expect(taughtIn([])).toBeUndefined();
  });
});
