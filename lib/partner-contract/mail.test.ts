import { describe, expect, test } from "bun:test";
import { buildPartnerContract, partnerContractText } from "./document";
import { type AcceptedPartnerContract, operatorReading, partnerCopyEmail } from "./mail";

const accepted = (commissionMonths: number | null): AcceptedPartnerContract => {
  const terms = {
    locale: "en" as const,
    partnerCompany: "Příklad s.r.o.",
    commissionPercent: 12,
    commissionMonths,
  };
  return {
    ...terms,
    id: "22222222-2222-4222-8222-222222222222",
    token: "a".repeat(64),
    partnerContactName: "Jana Nováková",
    partnerEmail: "jana@priklad.example",
    accessOutcome: "new_account",
    accessUserId: null,
    templateVersion: "test",
    body: buildPartnerContract(terms),
    createdAt: new Date("2026-10-15T08:00:00Z"),
    createdByEmail: "admin@nisd2.example",
    withdrawnAt: null,
    signedAt: new Date("2026-10-15T10:30:00Z"),
    signerName: "Jana Nováková",
    signerEmail: "jana@priklad.example",
    signerIp: null,
    signerUserAgent: null,
    signedTextSha256: "0".repeat(64),
    signedReadingLocale: "cs",
    signedTranslationSha256: "1".repeat(64),
  };
};

describe("operatorReading", () => {
  test("a translation names the text that binds, in German for the operators", () => {
    expect(operatorReading("cs", "en")).toBe(
      "Tschechisch (Übersetzung, verbindlich ist Englisch)",
    );
  });

  test("the binding text is just its language", () => {
    expect(operatorReading("en", "en")).toBe("Englisch");
    expect(operatorReading("de", "de")).toBe("Deutsch");
  });
});

describe("partnerCopyEmail", () => {
  test("a Czech reader gets a Czech letter around the English text they accepted", async () => {
    const row = accepted(12);
    const mail = await partnerCopyEmail(row, "cs");
    expect(mail.subject).toStartWith("Partnerská smlouva s nisd2 přijata, PV-");
    expect(mail.text).toStartWith("Dobrý den,");
    expect(mail.text).toContain("v anglickém znění, které je závazné");
    expect(mail.text).toContain(
      "Provize: 12 %, po dobu prvních 12 měsíců smlouvy tohoto zákazníka",
    );
    expect(mail.text).toContain("15. října 2026");
    expect(mail.text).toContain(partnerContractText(row.body));
    expect(mail.text).not.toContain("Hello");
  });

  test("one month and an open-ended commission read as the agreement words them", async () => {
    expect((await partnerCopyEmail(accepted(1), "cs")).text).toContain(
      "12 %, po dobu prvního měsíce smlouvy tohoto zákazníka",
    );
    expect((await partnerCopyEmail(accepted(null), "cs")).text).toContain(
      "12 %, po celou dobu, po kterou tento zákazník pokračuje",
    );
  });

  test("an English reader keeps the English letter", async () => {
    const mail = await partnerCopyEmail(accepted(12), "en");
    expect(mail.subject).toStartWith("Partner agreement with nisd2 accepted, PV-");
    expect(mail.text).toStartWith("Hello Jana Nováková,");
  });
});
