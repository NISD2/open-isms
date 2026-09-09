import { describe, expect, test } from "bun:test";
import { resolveEmailLocale } from "./locale";

describe("resolveEmailLocale", () => {
  test("stored de/en/nl wins over everything", () => {
    expect(resolveEmailLocale("de", "NL")).toBe("de");
    expect(resolveEmailLocale("en", "DE")).toBe("en");
    expect(resolveEmailLocale("nl", null)).toBe("nl");
  });

  test("stored locale without lifecycle copy falls to English, not German", () => {
    expect(resolveEmailLocale("fr", "DE")).toBe("en");
    expect(resolveEmailLocale("pl", null)).toBe("en");
  });

  test("no stored locale: company country decides", () => {
    expect(resolveEmailLocale(null, "DE")).toBe("de");
    expect(resolveEmailLocale(null, "AT")).toBe("de");
    expect(resolveEmailLocale(null, "CH")).toBe("de");
    expect(resolveEmailLocale(null, "NL")).toBe("nl");
    expect(resolveEmailLocale(null, "FR")).toBe("en");
  });

  test("country codes are matched case-insensitively", () => {
    expect(resolveEmailLocale(null, "de")).toBe("de");
    expect(resolveEmailLocale(null, "nl")).toBe("nl");
  });

  test("nothing known at all: platform default de", () => {
    expect(resolveEmailLocale(null, null)).toBe("de");
  });
});
