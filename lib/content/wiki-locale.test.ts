import { expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";
import { tocTranslation, wikiLabel, wikiLocale, wikiTocText } from "./wiki-locale";
import { WIKI_TOC } from "./wiki-toc";

test("Czech pages get Czech furniture; every other locale keeps what it had", () => {
  expect(
    Object.fromEntries(LOCALE_CODES.map((code) => [code, wikiLocale(code)])),
  ).toEqual({
    de: "de",
    en: "en",
    nl: "nl",
    fr: "de",
    it: "de",
    es: "de",
    pl: "de",
    cs: "cs",
    pt: "de",
    ro: "de",
  });
});

test("a label in code is Czech on a Czech page and unchanged everywhere else", () => {
  const badge = { cs: "čl. 23 NIS 2", other: "Art. 23 NIS 2" };
  expect(wikiLabel("cs", badge)).toBe("čl. 23 NIS 2");
  expect(["de", "en", "nl"].map((code) => wikiLabel(wikiLocale(code), badge))).toEqual([
    "Art. 23 NIS 2",
    "Art. 23 NIS 2",
    "Art. 23 NIS 2",
  ]);
});

test("every category has a Czech title and question", () => {
  const missing = Object.values(WIKI_TOC).flatMap(({ slug }) =>
    (["title", "question"] as const).filter(
      (field) => tocTranslation(`cat:${slug}`, field, "cs") === null,
    ),
  );
  expect(missing).toEqual([]);
});

test("a TOC text is German or English from the TOC, Czech from its translations", () => {
  const text = { de: "Grundlagen", en: "Basics" };
  expect(wikiTocText("de", "cat:grundlagen", "title", text)).toBe("Grundlagen");
  expect(wikiTocText("nl", "cat:grundlagen", "title", text)).toBe("Grundlagen");
  expect(wikiTocText("en", "cat:grundlagen", "title", text)).toBe("Basics");
  expect(wikiTocText("cs", "cat:grundlagen", "title", text)).toBe(
    tocTranslation("cat:grundlagen", "title", "cs") ?? "",
  );
  expect(wikiTocText("cs", "cat:no-such-category", "title", text)).toBe("Basics");
});
