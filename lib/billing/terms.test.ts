import { describe, expect, test } from "bun:test";
import { invoiceEmailWording } from "./order";
import { TERMS_VERSION, termsVersionLabel } from "./terms";

describe("terms version", () => {
  test("is an ISO calendar day, the shape invoice.terms_version stores", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TERMS_VERSION.length).toBeLessThanOrEqual(10);
  });

  test("reads as a German date on the German pages", () => {
    expect(termsVersionLabel("de", "2026-09-26")).toBe("26.09.2026");
    expect(termsVersionLabel("en", "2026-09-26")).toBe("26 September 2026");
  });
});

describe("invoice email names the accepted terms", () => {
  const base = {
    number: "RE-2026-0001",
    where: { attached: true, invoiceUrl: null },
  } as const;

  test("German email carries the version line", () => {
    const { paragraphs } = invoiceEmailWording({
      ...base,
      locale: "de",
      termsVersion: "2026-09-26",
    });
    expect(paragraphs).toContain("Es gelten unsere AGB in der Fassung vom 26.09.2026.");
  });

  test("no line when no acceptance was recorded", () => {
    const { paragraphs } = invoiceEmailWording({
      ...base,
      locale: "de",
      termsVersion: null,
    });
    expect(paragraphs.some((p) => p.includes("AGB"))).toBe(false);
  });
});

describe("invoice email links the invoice", () => {
  const url = "https://pay.example.invalid/invoices/abc";

  test("an attached PDF still comes with the online link", () => {
    const { paragraphs } = invoiceEmailWording({
      number: "RE-2026-0001",
      locale: "de",
      where: { attached: true, invoiceUrl: url },
      termsVersion: null,
    });
    expect(paragraphs[1]).toStartWith("anbei erhalten Sie die Rechnung RE-2026-0001");
    expect(paragraphs).toContain(`Online ansehen und herunterladen: ${url}`);
  });

  test("without the PDF the link is where the invoice is", () => {
    const { paragraphs } = invoiceEmailWording({
      number: "RE-2026-0001",
      locale: "en",
      where: { attached: false, invoiceUrl: url },
      termsVersion: null,
    });
    expect(paragraphs[1]).toBe(
      `invoice RE-2026-0001 for the NIS 2 guided pass annual licence is here: ${url}`,
    );
    expect(paragraphs.filter((p) => p.includes(url))).toHaveLength(1);
  });
});
