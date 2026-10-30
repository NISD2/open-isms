import { describe, expect, test } from "bun:test";
import { renderToBuffer } from "@react-pdf/renderer";
import { extractText, getDocumentProxy } from "unpdf";
import { POLICY_FIXTURE, REPORT_FIXTURE } from "@/scripts/lib/pdf-fixtures";
import { ComplianceReport } from "./compliance-report";
import { PDF_LOCALES } from "./format";
import { PolicyDocument } from "./policy-document";
import { POLICY_TITLES } from "./policy-labels";
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

describe("compliance report content", () => {
  test("prints a not-applicable reason with its date and the person who decided", async () => {
    const text = (
      await pagesOf(ComplianceReport({ data: REPORT_FIXTURE, locale: "de" }))
    ).join(" ");
    expect(text).toContain("Begründung");
    expect(text).toContain("Wir beziehen keine Cloud-Dienste");
    expect(text).toContain("Entschieden 2.3.2026, Jonas Pieper");
  });

  test("prints the signer's name with the role", async () => {
    const text = (
      await pagesOf(ComplianceReport({ data: REPORT_FIXTURE, locale: "de" }))
    ).join(" ");
    expect(text).toContain("Katrin Albers (Geschäftsführung)");
  });

  test("says where the walk met a requirement, as the journey does", async () => {
    const [gov, ...rest] = REPORT_FIXTURE.categories;
    const [first, second] = gov?.requirements ?? [];
    if (!gov || !first || !second) throw new Error("fixture changed");
    const data = {
      ...REPORT_FIXTURE,
      categories: [
        {
          ...gov,
          requirements: [
            {
              ...first,
              state: "signed" as const,
              coveredBy: { kind: "walk" as const, codes: ["2.4", "8.2"] },
            },
            {
              ...second,
              state: "na" as const,
              coveredBy: { kind: "not_required" as const },
            },
          ],
        },
        ...rest,
      ],
    };
    // The badge sets its words in capitals.
    const text = (await pagesOf(ComplianceReport({ data, locale: "de" })))
      .join(" ")
      .toLowerCase();
    expect(text).toContain("im durchgang mit 2.4 und 8.2 freigegeben");
    expect(text).toContain("gesetzlich nicht gefordert");
  });
});

describe("Czech documents", () => {
  test("the compliance report is labelled in Czech and dated the Czech way", async () => {
    const text = (await pagesOf(ComplianceReport({ data: REPORT_FIXTURE, locale: "cs" })))
      .join(" ")
      .toLowerCase();
    expect(text).toContain("zpráva o souladu");
    expect(text).toContain("důvod, proč se nevztahuje");
    expect(text).toContain("rozhodnuto 2. 3. 2026, jonas pieper");
    expect(text).toContain("it-grundschutz (německá metodika bsi)");
    expect(text).toMatch(/strana \d+ z \d+/);
  });

  test("the policy document is labelled in Czech", async () => {
    const text = (
      await pagesOf(PolicyDocument({ data: POLICY_FIXTURE, locale: "cs" }))
    ).join(" ");
    expect(text).toContain("Verze");
    expect(text).toMatch(/Strana \d+ z \d+/);
  });

  test("every label table has a policy title for every category English has", () => {
    for (const locale of PDF_LOCALES) {
      expect(Object.keys(POLICY_TITLES[locale]).toSorted()).toEqual(
        Object.keys(POLICY_TITLES.en).toSorted(),
      );
    }
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

  test("renders Czech, read back from the file", async () => {
    const pages = await pagesOf(SupplierQuestionnaireDocument({ locale: "cs" }));
    const all = pages.join(" ");
    expect(all).toContain("Dotazník pro dodavatele NIS 2");
    for (const glyph of ["č", "ř", "ů", "ě", "í"]) {
      expect(all).toContain(glyph);
    }
  });

  test("renders mono text containing spaces", async () => {
    // The header meta value is set in the mono face and holds a space.
    const pages = await pagesOf(SupplierQuestionnaireDocument({ locale: "en" }));
    expect(pages[0]).toContain("NISD2.eu");
  });
});
