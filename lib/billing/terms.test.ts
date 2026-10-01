import { describe, expect, test } from "bun:test";
import { invoiceDates, invoiceEmailWording } from "./order";
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

const order = {
  number: "RE-2026-0001",
  amounts: { netCents: 480_000, vatCents: 91_200 },
  dates: invoiceDates(new Date("2026-09-15T09:00:00Z")),
} as const;

describe("invoice email names the accepted terms", () => {
  const base = { ...order, where: { attached: true, invoiceUrl: null } } as const;

  test("German email carries the version line", () => {
    const { outro } = invoiceEmailWording({
      ...base,
      locale: "de",
      termsVersion: "2026-09-26",
    });
    expect(outro).toContain("Es gelten unsere AGB in der Fassung vom 26.09.2026.");
  });

  test("no line when no acceptance was recorded", () => {
    const { outro } = invoiceEmailWording({
      ...base,
      locale: "de",
      termsVersion: null,
    });
    expect(outro.some((p) => p.includes("AGB"))).toBe(false);
  });
});

describe("invoice email links the invoice", () => {
  const url = "https://pay.example.invalid/invoices/abc";

  test("an attached PDF still comes with the online link", () => {
    const { intro, link } = invoiceEmailWording({
      ...order,
      locale: "de",
      where: { attached: true, invoiceUrl: url },
      termsVersion: null,
    });
    expect(intro[0]).toStartWith("anbei erhalten Sie die Rechnung");
    expect(intro).toContain(`Online ansehen und herunterladen: ${url}`);
    expect(link).toBe(url);
  });

  test("without the PDF the link is where the invoice is", () => {
    const { intro } = invoiceEmailWording({
      ...order,
      locale: "en",
      where: { attached: false, invoiceUrl: url },
      termsVersion: null,
    });
    expect(intro[0]).toBe(
      `The invoice for the NIS 2 guided pass annual licence is here: ${url}`,
    );
    expect(intro.filter((p) => p.includes(url))).toHaveLength(1);
  });
});

describe("invoice email card", () => {
  const card = (locale: "de" | "en") =>
    invoiceEmailWording({
      ...order,
      locale,
      where: { attached: true, invoiceUrl: null },
      termsVersion: null,
    }).document;
  const fact = (locale: "de" | "en", label: string) =>
    card(locale).facts.find((f) => f.label === label);

  test("names the invoice by number and date", () => {
    expect(card("de").reference).toBe("RE-2026-0001 · 15. September 2026");
    expect(card("en").reference).toBe("RE-2026-0001 · 15 September 2026");
  });

  test("states the gross amount with net and VAT, as the invoice does", () => {
    expect(fact("de", "Betrag")?.value).toBe("5.712,00 €");
    expect(fact("de", "Betrag")?.detail).toBe(
      "4.800,00 € netto zzgl. 912,00 € USt (19 %)",
    );
    expect(fact("en", "Amount")?.value).toBe("€5,712.00");
  });

  test("the due date is thirty days after the invoice date, as the terms say", () => {
    expect(fact("de", "Zahlbar bis")?.value).toBe("15. Oktober 2026");
    expect(fact("en", "Due by")?.value).toBe("15 October 2026");
  });

  test("the payment reference is the invoice number", () => {
    expect(fact("de", "Verwendungszweck")?.value).toBe("RE-2026-0001");
  });
});
