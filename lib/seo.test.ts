import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { routing } from "@/i18n/routing";
import { HELP_LOCALES, pageAlternates } from "./seo";
import { relatedPathname } from "./seo-related";

/**
 * These pin the two claims a page makes about itself that nothing else checks:
 * which locales it says it exists in, and which URL it says is the original.
 *
 * Three passes of review on the /hilfe branch each found a regression in one
 * of them and each was caught by reading, not by running. Google is the only
 * other consumer and it does not report back, so a wrong answer here is
 * invisible until rankings move. A pure function and a static map are cheap to
 * hold still.
 */

const languagesOf = (a: ReturnType<typeof pageAlternates>) =>
  "languages" in a ? Object.keys(a.languages) : null;

describe("pageAlternates", () => {
  test("a page in every locale advertises every locale, plus x-default", () => {
    const alternates = pageAlternates("about", "de");
    expect(languagesOf(alternates)).toEqual([...routing.locales, "x-default"]);
  });

  test("a narrowed page advertises only the locales it exists in", () => {
    expect(languagesOf(pageAlternates("hilfe", "de", HELP_LOCALES))).toEqual([
      ...HELP_LOCALES,
      "x-default",
    ]);
  });

  test("every locale it advertises names itself in its own cluster", () => {
    // Google discards a whole hreflang set over a missing self-reference, so
    // the canonical of a member locale has to be one of the alternates it
    // lists. This is the assertion the first attempt at narrowing failed.
    for (const locale of HELP_LOCALES) {
      const alternates = pageAlternates("hilfe", locale, HELP_LOCALES);
      expect("languages" in alternates).toBe(true);
      if (!("languages" in alternates)) continue;
      expect(Object.values(alternates.languages)).toContain(alternates.canonical);
      expect(alternates.languages[locale]).toBe(alternates.canonical);
    }
  });

  test("x-default names a locale inside the set it heads", () => {
    for (const locales of [routing.locales, HELP_LOCALES] as const) {
      const alternates = pageAlternates("hilfe", "de", locales);
      if (!("languages" in alternates)) throw new Error("expected a cluster");
      const { "x-default": xDefault, ...rest } = alternates.languages;
      expect(Object.values(rest)).toContain(xDefault);
    }
  });

  test("a locale the page is not published in is a duplicate of the English one", () => {
    // It still resolves -- the route exists in all ten and the namespace falls
    // back to English -- so what it serves IS the English page. It carries one
    // canonical saying so and heads no cluster of its own.
    for (const locale of routing.locales.filter(
      (l) => !(HELP_LOCALES as readonly string[]).includes(l),
    )) {
      const alternates = pageAlternates("hilfe", locale, HELP_LOCALES);
      expect(languagesOf(alternates)).toBeNull();
      expect(alternates.canonical).toBe(
        pageAlternates("hilfe", "en", HELP_LOCALES).canonical,
      );
    }
  });
});

describe("relatedPathname", () => {
  test("resolves a wiki slug to the pathname key routing registers", () => {
    expect(relatedPathname("what-is-nis2")).toBe("/wiki/grundlagen/what-is-nis2");
  });

  test("returns null rather than guessing at a slug that resolves to nothing", () => {
    // The card is dropped; it does not become a link that 404s or bounces to
    // sign-in, which is what a hand-built `/${slug}` href used to do.
    expect(relatedPathname("no-such-article")).toBeNull();
  });

  test("reads no clock, so the server and the client agree", () => {
    // lib/seo-related is bundled into a "use client" component, so anything
    // time-dependent at module scope or in this function renders differently
    // in the browser than it did on the server. Two attempts at a publish
    // filter here were reverted for exactly that; this keeps the third from
    // being written.
    const source = readFileSync(new URL("./seo-related.ts", import.meta.url), "utf-8");
    const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(code).not.toContain("Date");
    expect(code).not.toContain("isPublished");
  });
});
