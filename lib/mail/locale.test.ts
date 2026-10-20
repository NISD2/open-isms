import { describe, expect, test } from "bun:test";
import { ALL_MAIL_IN_ENGLISH, resolveEmailLocale, workflowMailLocaleOf } from "./locale";

// While every mail is English, the per-language rules below are switched off, not deleted.
const whenLocalised = ALL_MAIL_IN_ENGLISH ? test.skip : test;

describe("all mail in English", () => {
  test("no stored locale or country changes the language", () => {
    expect(resolveEmailLocale("cs", "CZ")).toBe("en");
    expect(resolveEmailLocale("de", "DE")).toBe("en");
    expect(resolveEmailLocale(null, null)).toBe("en");
    expect(workflowMailLocaleOf("cs")).toBe("en");
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
  whenLocalised("Czech readers get Czech, everyone else the English these mails always had", () => {
    expect(workflowMailLocaleOf("cs")).toBe("cs");
    expect(workflowMailLocaleOf("en")).toBe("en");
    expect(workflowMailLocaleOf("de")).toBe("en");
    expect(workflowMailLocaleOf("nl")).toBe("en");
  });
});
