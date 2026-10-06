import { describe, expect, test } from "bun:test";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";
import { SELLER } from "@/lib/billing/seller";
import {
  buildPartnerContract,
  type PartnerContractTerms,
  partnerContractSha256,
  partnerContractText,
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
