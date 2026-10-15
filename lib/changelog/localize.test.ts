import { describe, expect, test } from "bun:test";
import { changelog } from "./load";
import { czechChangelog, localizeChangelog } from "./localize";

describe("the Czech changelog", () => {
  test("every entry and every link label has its Czech rendering", () => {
    const missing = changelog.entries.flatMap((entry) => {
      const czech = czechChangelog[entry.id];
      if (czech === undefined) return [entry.id];
      return (entry.links ?? [])
        .filter((link) => czech.links?.[link.href] === undefined)
        .map((link) => `${entry.id} ${link.href}`);
    });
    expect(missing).toEqual([]);
  });

  test("holds no entry the changelog does not have", () => {
    const ids = new Set(changelog.entries.map((entry) => entry.id));
    expect(Object.keys(czechChangelog).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe("localizeChangelog", () => {
  const entry = {
    id: "2026-01-01-test",
    date: "2026-01-01",
    category: "product" as const,
    titleDe: "Titel",
    titleEn: "Title",
    bodyDe: "Text",
    bodyEn: "Body",
    links: [{ labelDe: "Mehr", labelEn: "More", href: "/x" }],
    version: "v1",
  };

  test("German and English readers get their own words, and the facts stay", () => {
    expect(localizeChangelog([entry], "de")[0]).toEqual({
      id: entry.id,
      date: "2026-01-01",
      category: "product",
      version: "v1",
      title: "Titel",
      body: "Text",
      links: [{ href: "/x", label: "Mehr" }],
    });
    expect(localizeChangelog([entry], "en")[0]?.title).toBe("Title");
  });

  test("a language without its own rendering reads English, never German", () => {
    expect(localizeChangelog([entry], "nl")[0]?.body).toBe("Body");
  });

  test("a Czech reader gets the Czech rendering of a real entry", () => {
    const first = changelog.entries[0];
    if (first === undefined) throw new Error("the changelog is empty");
    const czech = czechChangelog[first.id];
    expect(localizeChangelog([first], "cs")[0]?.title).toBe(czech?.title ?? "");
  });
});
