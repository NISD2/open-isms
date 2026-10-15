import { describe, expect, test } from "bun:test";
import { resolveEmailLocale, workflowMailLocaleOf } from "./locale";

describe("resolveEmailLocale", () => {
  test("stored de/en/nl/cs wins over everything", () => {
    expect(resolveEmailLocale("de", "NL")).toBe("de");
    expect(resolveEmailLocale("en", "DE")).toBe("en");
    expect(resolveEmailLocale("nl", null)).toBe("nl");
    expect(resolveEmailLocale("cs", null)).toBe("cs");
    expect(resolveEmailLocale("cs", "DE")).toBe("cs");
  });

  test("a chosen language beats a Czech company", () => {
    expect(resolveEmailLocale("de", "CZ")).toBe("de");
    expect(resolveEmailLocale("en", "CZ")).toBe("en");
  });

  test("stored locale without lifecycle copy falls to English, not German", () => {
    expect(resolveEmailLocale("fr", "DE")).toBe("en");
    expect(resolveEmailLocale("pl", null)).toBe("en");
    expect(resolveEmailLocale("pl", "CZ")).toBe("en");
  });

  test("no stored locale: company country decides", () => {
    expect(resolveEmailLocale(null, "DE")).toBe("de");
    expect(resolveEmailLocale(null, "AT")).toBe("de");
    expect(resolveEmailLocale(null, "CH")).toBe("de");
    expect(resolveEmailLocale(null, "NL")).toBe("nl");
    expect(resolveEmailLocale(null, "CZ")).toBe("cs");
    expect(resolveEmailLocale(null, "FR")).toBe("en");
    expect(resolveEmailLocale(null, "SK")).toBe("en");
  });

  test("country codes are matched case-insensitively", () => {
    expect(resolveEmailLocale(null, "de")).toBe("de");
    expect(resolveEmailLocale(null, "nl")).toBe("nl");
    expect(resolveEmailLocale(null, "cz")).toBe("cs");
  });

  test("nothing known at all: platform default de", () => {
    expect(resolveEmailLocale(null, null)).toBe("de");
  });
});

describe("workflowMailLocaleOf", () => {
  test("Czech readers get Czech, everyone else the English these mails always had", () => {
    expect(workflowMailLocaleOf("cs")).toBe("cs");
    expect(workflowMailLocaleOf("en")).toBe("en");
    expect(workflowMailLocaleOf("de")).toBe("en");
    expect(workflowMailLocaleOf("nl")).toBe("en");
  });
});
