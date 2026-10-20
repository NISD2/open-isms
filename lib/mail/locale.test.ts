import { describe, expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";
import {
  codeMailLocale,
  EMAIL_LOCALES,
  isApprovedMailLocale,
  resolveEmailLocale,
  workflowMailLocaleOf,
} from "./locale";

// The per-language rules below describe every language being approved; until then they are
// switched off, not deleted.
const whenLocalised = EMAIL_LOCALES.every(isApprovedMailLocale) ? test : test.skip;

const COUNTRIES = [null, "DE", "AT", "NL", "CZ", "FR", "PL"] as const;

describe("only approved languages are ever sent", () => {
  test("whatever the account says, the resolved language is approved", () => {
    for (const locale of [null, ...LOCALE_CODES]) {
      for (const country of COUNTRIES) {
        expect(isApprovedMailLocale(resolveEmailLocale(locale, country))).toBe(true);
      }
    }
  });

  test("code mails (OTP, reset) are approved for every request locale", () => {
    for (const locale of [undefined, ...LOCALE_CODES]) {
      expect(isApprovedMailLocale(codeMailLocale(locale))).toBe(true);
    }
  });

  test("the workflow mail language is approved", () => {
    for (const locale of EMAIL_LOCALES) {
      expect(isApprovedMailLocale(workflowMailLocaleOf(locale))).toBe(true);
    }
  });
});

describe("resolveEmailLocale", () => {
  whenLocalised("stored de/en/nl/cs wins over everything", () => {
    expect(resolveEmailLocale("de", "NL")).toBe("de");
    expect(resolveEmailLocale("en", "DE")).toBe("en");
    expect(resolveEmailLocale("nl", null)).toBe("nl");
    expect(resolveEmailLocale("cs", null)).toBe("cs");
    expect(resolveEmailLocale("cs", "DE")).toBe("cs");
  });

  whenLocalised("a chosen language beats a Czech company", () => {
    expect(resolveEmailLocale("de", "CZ")).toBe("de");
    expect(resolveEmailLocale("en", "CZ")).toBe("en");
  });

  test("stored locale without lifecycle copy falls to English, not German", () => {
    expect(resolveEmailLocale("fr", "DE")).toBe("en");
    expect(resolveEmailLocale("pl", null)).toBe("en");
    expect(resolveEmailLocale("pl", "CZ")).toBe("en");
  });

  whenLocalised("no stored locale: company country decides", () => {
    expect(resolveEmailLocale(null, "DE")).toBe("de");
    expect(resolveEmailLocale(null, "AT")).toBe("de");
    expect(resolveEmailLocale(null, "CH")).toBe("de");
    expect(resolveEmailLocale(null, "NL")).toBe("nl");
    expect(resolveEmailLocale(null, "CZ")).toBe("cs");
    expect(resolveEmailLocale(null, "FR")).toBe("en");
    expect(resolveEmailLocale(null, "SK")).toBe("en");
  });

  whenLocalised("country codes are matched case-insensitively", () => {
    expect(resolveEmailLocale(null, "de")).toBe("de");
    expect(resolveEmailLocale(null, "nl")).toBe("nl");
    expect(resolveEmailLocale(null, "cz")).toBe("cs");
  });

  whenLocalised("nothing known at all: platform default de", () => {
    expect(resolveEmailLocale(null, null)).toBe("de");
  });
});

describe("workflowMailLocaleOf", () => {
  whenLocalised(
    "Czech readers get Czech, everyone else the English these mails always had",
    () => {
      expect(workflowMailLocaleOf("cs")).toBe("cs");
      expect(workflowMailLocaleOf("en")).toBe("en");
      expect(workflowMailLocaleOf("de")).toBe("en");
      expect(workflowMailLocaleOf("nl")).toBe("en");
    },
  );
});
