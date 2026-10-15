import { describe, expect, test } from "bun:test";
import { seedLocaleOf } from "./seed-locale";

describe("seedLocaleOf", () => {
  // The rule it replaced, written out: a Czech choice, or Czechia with no choice, is Czech;
  // otherwise German where the resolver says German, else English.
  test.each([
    ["cs", null, "cs"],
    [null, "CZ", "cs"],
    ["de", null, "de"],
    ["nl", null, "en"],
    ["fr", null, "en"],
    [null, "DE", "de"],
    [null, "NL", "en"],
    [null, null, "de"],
  ] as const)("user %p, country %p gives %p", (userLocale, country, expected) => {
    expect(seedLocaleOf(userLocale, country)).toBe(expected);
  });

  test("the user's choice wins over the company's country", () => {
    expect(seedLocaleOf("en", "CZ")).toBe("en");
    expect(seedLocaleOf("cs", "DE")).toBe("cs");
  });
});
