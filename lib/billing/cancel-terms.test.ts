import { describe, expect, test } from "bun:test";
import type { DocumentEmail } from "@/lib/mail/templates";
import {
  canceledEmailWording,
  cancelWindow,
  creditNoteLine,
  refundDueDay,
  refundSentWording,
} from "./cancel-terms";

/** Every word a reader sees, in reading order, for checks that do not care where a phrase sits. */
const wordsOf = (mail: DocumentEmail): string =>
  [
    mail.subject,
    mail.heading,
    mail.greeting,
    ...mail.intro,
    mail.document.kind,
    mail.document.reference,
    ...mail.document.facts.flatMap((f) => [f.label, f.value, f.detail ?? ""]),
    ...mail.outro,
  ].join(" ");

const moneyBack = {
  kind: "money_back",
  invoiceNumber: "RE-2026-0001",
  invoiceIssueDate: "2026-09-15",
  creditNoteNumber: "GS-2026-0001",
  creditNoteDate: "2026-10-01",
  amounts: { netCents: 480_000, vatCents: 91_200 },
  attached: true,
} as const;

describe("cancelWindow", () => {
  const first = { issueDate: "2026-09-01", firstInvoice: true } as const;
  const later = { issueDate: "2026-09-01", firstInvoice: false } as const;

  test("the first invoice: the order day is day 0 and inside the thirty days", () => {
    expect(cancelWindow(first, new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "money_back",
      day: 0,
      lastDay: "2026-10-01",
    });
  });

  test("the first invoice: the thirtieth day is still inside, the next is not", () => {
    expect(cancelWindow(first, new Date("2026-10-01T20:00:00Z")).kind).toBe("money_back");
    expect(cancelWindow(first, new Date("2026-10-02T08:00:00Z"))).toEqual({
      kind: "renewal",
      day: 31,
      reason: "window_passed",
    });
  });

  test("a later invoice never has money back, even on its order day", () => {
    expect(cancelWindow(later, new Date("2026-09-01T10:00:00Z"))).toEqual({
      kind: "renewal",
      day: 0,
      reason: "not_first_invoice",
    });
    expect(cancelWindow(later, new Date("2026-09-15T10:00:00Z"))).toEqual({
      kind: "renewal",
      day: 14,
      reason: "not_first_invoice",
    });
  });

  test("the day is counted in Berlin, not on the server's clock", () => {
    // 22:30 UTC on the 1st of October is already the 2nd in Berlin.
    expect(cancelWindow(first, new Date("2026-10-01T22:30:00Z")).kind).toBe("renewal");
  });
});

describe("creditNoteLine", () => {
  const invoice = {
    number: "RE-2026-0001",
    netCents: 480_000,
    vatCents: 91_200,
    periodStart: "2026-09-01",
    periodEnd: "2027-08-31",
  };

  test("credits the whole net at the rate the invoice was issued with", () => {
    const line = creditNoteLine(invoice, "de");
    expect(line.unitPrice).toEqual({ value: "4800.00", currency: "EUR" });
    expect(line.vatRate).toBe("0.19");
    expect(line.quantity).toBe("1");
  });

  test("a reverse charged invoice is credited without VAT", () => {
    expect(creditNoteLine({ ...invoice, vatCents: 0 }, "en").vatRate).toBe("0.00");
  });
});

describe("refundDueDay", () => {
  test("is thirty days after the cancel, as the terms promise", () => {
    expect(refundDueDay("2026-10-01")).toBe("2026-10-31");
    expect(refundDueDay("2026-12-15")).toBe("2027-01-14");
  });
});

describe("canceledEmailWording", () => {
  test("says a refund is coming, and by when, only when the invoice was paid", () => {
    const paid = wordsOf(canceledEmailWording({ ...moneyBack, refundOwed: true }, "de"));
    const unpaid = wordsOf(
      canceledEmailWording({ ...moneyBack, refundOwed: false }, "de"),
    );
    expect(paid).toContain("Rückzahlung bis 31. Oktober 2026");
    expect(paid).toContain("auf das Konto, von dem Ihre Zahlung kam");
    expect(unpaid).not.toContain("Rückzahlung");
    // Unpaid in Qonto is not proof that no transfer is on its way.
    expect(unpaid).toContain("innerhalb von 30 Tagen nach seinem Eingang");
    expect(unpaid).not.toContain("nichts weiter");
  });

  test("the card names the credit note, the invoice it cancels and the amount", () => {
    const { document } = canceledEmailWording({ ...moneyBack, refundOwed: false }, "de");
    expect(document.reference).toBe("GS-2026-0001 · 1. Oktober 2026");
    expect(document.facts.map((f) => f.value)).toContain(
      "Rechnung RE-2026-0001 vom 15. September 2026",
    );
    expect(document.facts.find((f) => f.label === "Betrag")?.value).toBe("5.712,00 €");
  });

  test("a later invoice's renewal cancel says why there is no money back", () => {
    const mail = {
      kind: "renewal",
      invoiceNumber: "RE-2027-0001",
      periodEnd: "2028-08-31",
    } as const;
    const later = canceledEmailWording({ ...mail, reason: "not_first_invoice" }, "de");
    const passed = canceledEmailWording({ ...mail, reason: "window_passed" }, "de");
    expect(wordsOf(later)).toContain("nur für die erste Bestellung");
    expect(wordsOf(passed)).toContain("sind vorbei");
  });

  test("a cancel made by deleting the account promises neither access, kept data nor another email", () => {
    const renewal = {
      kind: "renewal",
      invoiceNumber: "RE-2026-0001",
      periodEnd: "2027-08-31",
      reason: "window_passed",
    } as const;
    const paidBack = { ...moneyBack, refundOwed: true } as const;
    for (const locale of ["de", "en", "nl"] as const) {
      for (const mail of [renewal, paidBack]) {
        const kept = wordsOf(canceledEmailWording(mail, locale));
        const erased = wordsOf(
          canceledEmailWording({ ...mail, accountErased: true }, locale),
        );
        expect(erased).not.toEqual(kept);
        expect(erased).not.toMatch(
          /bleiben in Ihrem Konto|stay in your account|blijven in uw/,
        );
        expect(erased).not.toMatch(/Zugang bis|Access until|Toegang tot/);
        // Nobody is left to send the refund confirmation to.
        expect(erased).not.toMatch(/kurzen E-Mail|short email|korte e-mail/);
        // The holder reads it inside the erasure confirmation, the accounting copy needs no word of it.
        expect(erased).not.toMatch(/eigenen E-Mail|separate email|aparte e-mail/);
      }
    }
  });

  test("a paid cancel announces the refund confirmation while the account stays", () => {
    const words = wordsOf(canceledEmailWording({ ...moneyBack, refundOwed: true }, "en"));
    expect(words).toContain("we confirm it in a short email");
  });

  test("carries no em dash in any language", () => {
    for (const locale of ["de", "en", "nl"] as const) {
      const mails = [
        canceledEmailWording({ ...moneyBack, refundOwed: true, attached: false }, locale),
        canceledEmailWording(
          {
            kind: "renewal",
            invoiceNumber: "RE-2026-0001",
            periodEnd: "2027-08-31",
            reason: "not_first_invoice",
          },
          locale,
        ),
        refundSentWording(
          {
            creditNoteNumber: "GS-2026-0001",
            invoiceNumber: "RE-2026-0001",
            amounts: moneyBack.amounts,
          },
          locale,
        ),
      ];
      for (const mail of mails) expect(wordsOf(mail)).not.toContain("—");
    }
  });
});

describe("refundSentWording", () => {
  test("names the credit note, the invoice and the gross amount refunded", () => {
    const mail = refundSentWording(
      {
        creditNoteNumber: "GS-2026-0001",
        invoiceNumber: "RE-2026-0001",
        amounts: moneyBack.amounts,
      },
      "de",
    );
    expect(mail.subject).toBe(
      "Erstattung zur Gutschrift GS-2026-0001: Betrag überwiesen",
    );
    expect(wordsOf(mail)).toContain("Rechnung RE-2026-0001");
    expect(mail.document.facts.find((f) => f.label === "Erstattet")?.value).toBe(
      "5.712,00 €",
    );
  });
});
