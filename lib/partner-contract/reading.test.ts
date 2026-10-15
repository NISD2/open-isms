import { describe, expect, test } from "bun:test";
import {
  buildPartnerContract,
  type PartnerContractTerms,
  partnerContractSha256,
  partnerContractTranslation,
} from "./document";
import {
  bindingLocaleFor,
  PARTNER_CONTRACT_READING_LOCALES,
  readingLocaleOf,
  readingLocalesOf,
  signedReadingOf,
} from "./reading";

const stored = (locale: PartnerContractTerms["locale"]) => {
  const terms: PartnerContractTerms = {
    locale,
    partnerCompany: "Příklad s.r.o.",
    commissionPercent: 12,
    commissionMonths: 12,
  };
  return { ...terms, body: buildPartnerContract(terms) };
};

describe("bindingLocaleFor", () => {
  test("a Czech reader is offered the English text; German and English bind as themselves", () => {
    expect(bindingLocaleFor("cs")).toBe("en");
    expect(bindingLocaleFor("en")).toBe("en");
    expect(bindingLocaleFor("de")).toBe("de");
  });

  test("covers every language the admin can pick", () => {
    expect([...PARTNER_CONTRACT_READING_LOCALES]).toEqual(["de", "en", "cs"]);
  });
});

describe("readingLocaleOf", () => {
  test("a Czech reader of an English offer reads Czech", () => {
    expect(readingLocaleOf(stored("en"), "cs")).toBe("cs");
  });

  test("any other request reads the offer's own language, as its page does", () => {
    expect(readingLocaleOf(stored("en"), "de")).toBe("en");
    expect(readingLocaleOf(stored("en"), "fr")).toBe("en");
    expect(readingLocaleOf(stored("de"), "cs")).toBe("de");
    expect(readingLocaleOf(stored("de"), "en")).toBe("de");
  });

  test("older wording has no translation, so a Czech request reads the stored English", () => {
    const offer = stored("en");
    const older = { ...offer, body: { ...offer.body, title: "Partner agreement (old)" } };
    expect(readingLocaleOf(older, "cs")).toBe("en");
  });
});

describe("signedReadingOf", () => {
  test("a Czech reader of an English offer: Czech, and the hash of the Czech text the page shows", () => {
    const offer = stored("en");
    const shown = partnerContractTranslation(offer, "cs");
    if (!shown) throw new Error("no Czech text under today's wording");
    expect(signedReadingOf(offer, "cs")).toEqual({
      signedReadingLocale: "cs",
      signedTranslationSha256: partnerContractSha256(shown.body),
    });
    expect(signedReadingOf(offer, "cs").signedTranslationSha256).not.toBe(
      partnerContractSha256(offer.body),
    );
  });

  test("a reader of the binding text records its language and no translation", () => {
    expect(signedReadingOf(stored("en"), "en")).toEqual({
      signedReadingLocale: "en",
      signedTranslationSha256: null,
    });
    expect(signedReadingOf(stored("de"), "cs")).toEqual({
      signedReadingLocale: "de",
      signedTranslationSha256: null,
    });
  });

  test("older wording has no translation, so a Czech request records the English it read", () => {
    const offer = stored("en");
    const older = { ...offer, body: { ...offer.body, title: "Partner agreement (old)" } };
    expect(signedReadingOf(older, "cs")).toEqual({
      signedReadingLocale: "en",
      signedTranslationSha256: null,
    });
  });
});

describe("readingLocalesOf", () => {
  test("an English offer has an English and a Czech link", () => {
    expect(readingLocalesOf(stored("en"))).toEqual(["en", "cs"]);
  });

  test("a German offer has only its German link", () => {
    expect(readingLocalesOf(stored("de"))).toEqual(["de"]);
  });
});
