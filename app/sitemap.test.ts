import { expect, test } from "bun:test";
import { listOnlyOwnText } from "./sitemap";

const entry = (
  url: string,
  languages: Record<string, string>,
  lastModified = "2026-05-10",
) => ({
  url,
  lastModified,
  alternates: { languages },
});

const languages = {
  de: "https://nisd2.eu/wiki/sektoren",
  en: "https://nisd2.eu/en/wiki/sectors",
  fr: "https://nisd2.eu/fr/wiki/secteurs",
  cs: "https://nisd2.eu/cs/wiki/sectors",
};

const entries = Object.values(languages).map((url) => entry(url, languages));

test("a language version that copies German or English leaves the list, and every hreflang that named it", () => {
  const listed = listOnlyOwnText(entries, new Set(["/fr/wiki/secteurs"]));

  expect(listed.map((e) => e.url)).not.toContain(languages.fr);
  expect(listed).toHaveLength(3);
  for (const e of listed) {
    expect(Object.keys(e.alternates?.languages ?? {})).toEqual(["de", "en", "cs"]);
  }
});

test("German and English pages stay when nothing is measured as a copy", () => {
  expect(listOnlyOwnText(entries, new Set())).toHaveLength(4);
});

test("Czech entries carry the day its text was rewritten, so Google has a reason to look again", () => {
  const byUrl = Object.fromEntries(
    listOnlyOwnText(entries, new Set()).map((e) => [e.url, e.lastModified]),
  );

  expect(byUrl[languages.cs]).toBe("2026-10-15");
  expect(byUrl[languages.de]).toBe("2026-05-10");
});

test("a Czech page reviewed after the rewrite keeps its later date", () => {
  const reviewed = [entry(languages.cs, languages, "2026-10-17")];

  expect(listOnlyOwnText(reviewed, new Set())[0].lastModified).toBe("2026-10-17");
});
