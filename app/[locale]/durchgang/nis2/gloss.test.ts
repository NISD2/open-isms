import { describe, expect, test } from "bun:test";
import { getMergedDictionary } from "@/lib/dictionary/index";
import { glossOf, WALK_TERMS } from "./gloss";

const terms = (text: string, locale: "de" | "en") =>
  (glossOf(text, locale) ?? []).flatMap((c) => ("term" in c ? [c.term] : []));

describe("the terms the walk explains in place", () => {
  test("are all in the dictionary", () => {
    const slugs = new Set(
      (["de", "en"] as const).flatMap((locale) =>
        [...getMergedDictionary(locale).values()].map((t) => t.slug),
      ),
    );
    for (const slug of WALK_TERMS) expect(slugs.has(slug)).toBe(true);
  });

  test("explain checked terms and leave the rest of the dictionary as plain text", () => {
    expect(terms("Die Geschäftsführung beachtet das BSIG.", "de")).toEqual(["BSIG"]);
    expect(terms("The policy follows the BSIG.", "en")).toEqual(["BSIG"]);
  });

  test("give nothing back for a text without such a term, and keep every word", () => {
    expect(glossOf("Die Geschäftsführung unterschreibt.", "de")).toBeNull();
    const glossed = glossOf("Ein Lieferant und das BSIG.", "de") ?? [];
    expect(glossed.map((c) => ("term" in c ? c.term : c.text)).join("")).toBe(
      "Ein Lieferant und das BSIG.",
    );
  });
});
