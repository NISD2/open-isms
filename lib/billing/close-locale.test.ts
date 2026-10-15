import { describe, expect, test } from "bun:test";
import { closeLocale } from "./close-locale";

describe("closeLocale", () => {
  test("the admin's pick wins over the VAT country", () => {
    expect(closeLocale("DE123456789", "cs")).toBe("cs");
    expect(closeLocale("CZ12345678", "en")).toBe("en");
  });

  test("without a pick, a German or Czech VAT number sets that language", () => {
    expect(closeLocale("DE123456789", null)).toBe("de");
    expect(closeLocale("CZ12345678", null)).toBe("cs");
    expect(closeLocale("cz 1234 5678", null)).toBe("cs");
  });

  test("any other country, or no readable VAT number, gets English", () => {
    expect(closeLocale("NL123456789B01", null)).toBe("en");
    expect(closeLocale("ATU12345678", null)).toBe("en");
    expect(closeLocale("", null)).toBe("en");
  });
});
