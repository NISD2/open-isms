import { expect, test } from "bun:test";
import { isGermanReading, readerCountry } from "./reader-country";

test("no country asked for reads as Germany, except for a Czech reader", () => {
  expect(readerCountry("de")).toBeUndefined();
  expect(readerCountry("en")).toBeUndefined();
  expect(readerCountry("cs")).toBe("CZ");
});

test("a country asked for wins over the locale, in upper case", () => {
  expect(readerCountry("cs", "DE")).toBe("DE");
  expect(readerCountry("en", "nl")).toBe("NL");
});

test("the German answer shows for Germany and for no country, never for another", () => {
  expect(isGermanReading(undefined)).toBe(true);
  expect(isGermanReading("DE")).toBe(true);
  expect(isGermanReading("NL")).toBe(false);
  expect(isGermanReading(readerCountry("cs"))).toBe(false);
});
