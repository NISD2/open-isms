import { describe, expect, test } from "bun:test";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";
import { SELLER } from "@/lib/billing/seller";
import {
  buildPartnerContract,
  type PartnerContractTerms,
  partnerContractSha256,
  partnerContractText,
  partnerContractTranslation,
} from "./document";

const terms = (over: Partial<PartnerContractTerms> = {}): PartnerContractTerms => ({
  locale: "de",
  partnerCompany: "Muster Beratung GmbH",
  commissionPercent: 12,
  commissionMonths: 12,
  ...over,
});

describe("buildPartnerContract", () => {
  test("names both parties, the price from the offer and the agreed commission", () => {
    const text = partnerContractText(buildPartnerContract(terms()));
    expect(text).toContain(SELLER.name);
    expect(text).toContain("Muster Beratung GmbH (nachfolgend „Partner“)");
    expect(text).toContain(formatWholeEuro(ANNUAL_NET_CENTS, "de-DE"));
    expect(text).toContain("12 Prozent");
    expect(text).toContain("für die ersten 12 Monate seines Vertrags");
  });

  test("lists the pricing card's features, without their markup", () => {
    const body = buildPartnerContract(terms());
    const offer = body.sections[1];
    const list = offer?.blocks.find((block) => block.kind === "list");
    expect(list?.kind === "list" ? list.items.length : 0).toBe(8);
    expect(partnerContractText(body)).not.toContain("<cal>");
  });

  test("an open-ended commission says so instead of a month count", () => {
    const text = partnerContractText(
      buildPartnerContract(terms({ commissionMonths: null })),
    );
    expect(text).toContain("solange dieser Kunde seinen Vertrag mit nisd2 fortführt");
    expect(text).not.toContain("Monate seines Vertrags");
  });

  test("English reads in English with the same facts", () => {
    const text = partnerContractText(buildPartnerContract(terms({ locale: "en" })));
    expect(text).toContain("# Partner agreement");
    expect(text).toContain("12 percent of every net payment");
    expect(text).toContain(formatWholeEuro(ANNUAL_NET_CENTS, "en-GB"));
  });

  test("the acceptance hash follows the text and nothing else", () => {
    const a = buildPartnerContract(terms());
    expect(partnerContractSha256(a)).toBe(partnerContractSha256(structuredClone(a)));
    expect(partnerContractSha256(a)).not.toBe(
      partnerContractSha256(buildPartnerContract(terms({ commissionPercent: 13 }))),
    );
  });
});

describe("partnerContractTranslation", () => {
  const stored = (over: Partial<PartnerContractTerms> = {}) => {
    const t = terms({ locale: "en", ...over });
    return { ...t, body: buildPartnerContract(t) };
  };

  test("a Czech reader of an English offer reads it in Czech, with the same facts", () => {
    const translation = partnerContractTranslation(stored(), "cs");
    expect(translation?.locale).toBe("cs");
    const text = partnerContractText(translation?.body ?? stored().body);
    expect(text).toContain("# Partnerská smlouva");
    expect(text).toContain("Muster Beratung GmbH („Partner“)");
    expect(text).toContain("12 procent z každé čisté platby");
    expect(text).toContain("po dobu prvních 12 měsíců smlouvy tohoto zákazníka");
    expect(text).toContain(formatWholeEuro(ANNUAL_NET_CENTS, "cs-CZ"));
  });

  test("one month reads as one month", () => {
    const text = partnerContractText(
      partnerContractTranslation(stored({ commissionMonths: 1 }), "cs")?.body ??
        stored().body,
    );
    expect(text).toContain("po dobu prvního měsíce smlouvy tohoto zákazníka");
  });

  test("what is signed stays the stored English text", () => {
    const offer = stored();
    const before = partnerContractSha256(offer.body);
    partnerContractTranslation(offer, "cs");
    expect(partnerContractSha256(offer.body)).toBe(before);
    expect(partnerContractText(offer.body)).toContain("# Partner agreement");
  });

  test("no translation for a binding-language reader, a German offer or older wording", () => {
    expect(partnerContractTranslation(stored(), "en")).toBeNull();
    expect(partnerContractTranslation(stored(), "de")).toBeNull();
    const german = terms({ locale: "de" });
    expect(
      partnerContractTranslation({ ...german, body: buildPartnerContract(german) }, "cs"),
    ).toBeNull();
    const older = stored();
    const edited = {
      ...older,
      body: { ...older.body, title: "Partner agreement (earlier wording)" },
    };
    expect(partnerContractTranslation(edited, "cs")).toBeNull();
  });

  test("Czech has every string the agreement uses, so nothing falls back to English", () => {
    const text = partnerContractText(
      partnerContractTranslation(stored({ commissionMonths: null }), "cs")?.body ??
        stored().body,
    );
    expect(text).toContain("po celou dobu, po kterou tento zákazník pokračuje");
    expect(text).not.toContain("Partner agreement");
    expect(text).not.toContain("<cal>");
  });
});
