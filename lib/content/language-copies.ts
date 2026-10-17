import measured from "./sitemap-language-copies.json";

/**
 * The URLs whose text is a copy of another language's page, by path, with the language they
 * copy ("de" or "en"). Measured by scripts/measure-language-copies.ts. The sitemap leaves them
 * out and each of them names the original as its canonical, so Google sees one page where the
 * routes serve two.
 */
export const languageCopies: ReadonlyMap<string, "de" | "en"> = new Map(
  Object.entries(measured.copies).flatMap(([path, language]) =>
    language === "de" || language === "en" ? [[path, language] as const] : [],
  ),
);
