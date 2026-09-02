import { describe, expect, test } from "bun:test";
import { renderToBuffer } from "@react-pdf/renderer";
import { extractText, getDocumentProxy } from "unpdf";
import { POLICY_FIXTURE, REPORT_FIXTURE } from "@/scripts/lib/pdf-fixtures";
import { ComplianceReport } from "./compliance-report";
import { PolicyDocument } from "./policy-document";
import { styles } from "./styles";
import { SupplierQuestionnaireDocument } from "./supplier-questionnaire";

/**
 * These render real documents rather than asserting on styles, because the two
 * failures worth catching here are both silent: react-pdf does not error when a
 * document loses its running footer, and fontkit does not error until a glyph
 * it cannot measure actually reaches a page.
 */

async function pagesOf(node: React.ReactElement): Promise<string[]> {
  const buffer = await renderToBuffer(node);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return (text as string[]).map((page) => page.replace(/\s+/g, " ").trim());
}

describe("running footers", () => {
  // A page-level `lineHeight` is inherited into the `fixed` footer and makes
  // react-pdf drop it from every page without erroring. It shipped that way
  // once; this is the tripwire.
  test("the shared page style sets no lineHeight", () => {
    expect(styles.page).not.toHaveProperty("lineHeight");
  });

  test("every body page of the compliance report carries a footer", async () => {
    const pages = await pagesOf(ComplianceReport({ data: REPORT_FIXTURE, locale: "en" }));
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages.slice(1)) {
      expect(page).toContain(REPORT_FIXTURE.companyName);
      expect(page).toMatch(/Page \d+ of \d+/);
    }
  });

  test("the policy document carries a footer", async () => {
    const pages = await pagesOf(PolicyDocument({ data: POLICY_FIXTURE, locale: "en" }));
    expect(pages[pages.length - 1]).toMatch(/Page \d+ of \d+/);
  });
});

describe("glyph coverage", () => {
  // IBM Plex Mono's Google Fonts build puts `space` in the last four glyphs of
  // `glyf`, where fontkit reads past the end of the table and throws. Any mono
  // text with a space in it took the whole render down with a 500.
  test("renders Polish, which the base-14 fallback cannot encode", async () => {
    const pages = await pagesOf(SupplierQuestionnaireDocument({ locale: "pl" }));
    const all = pages.join(" ");
    for (const glyph of ["ł", "ż", "ś", "ę", "ą"]) {
      expect(all).toContain(glyph);
    }
  });

  test("renders mono text containing spaces", async () => {
    // The header meta value is set in the mono face and holds a space.
    const pages = await pagesOf(SupplierQuestionnaireDocument({ locale: "en" }));
    expect(pages[0]).toContain("NISD2.eu");
  });
});
