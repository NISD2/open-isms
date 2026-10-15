import { describe, expect, test } from "bun:test";
import { ANNUAL_NET_CENTS, priceFor } from "./order";
import { priceView } from "./quote";

/** Intl separates thousands and the sign with no-break spaces in Czech; written plain here. */
const plain = (s: string) => s.replaceAll(" ", " ");

describe("priceView", () => {
  // A German customer: German VAT, so net, VAT and gross all differ.
  const money = priceFor("DE", null, ANNUAL_NET_CENTS);

  test("a Czech reader reads Czech numbers, in euros, with the same amounts", () => {
    const view = priceView(money, "cs");
    expect(plain(view.net)).toBe("4 800,00 €");
    expect(plain(view.gross)).toBe("5 712,00 €");
    expect(view.grossCents).toBe(money.grossCents);
  });

  test("without a reader language it stays German, as before", () => {
    expect(priceView(money).net).toBe(priceView(money, "de").net);
    expect(plain(priceView(money).net)).toBe("4.800,00 €");
  });

  test.each(["en", "nl"])(
    "a %s reader keeps the German format it saw before",
    (locale) => {
      expect(plain(priceView(money, locale).net)).toBe("4.800,00 €");
      expect(plain(priceView(money, locale).gross)).toBe("5.712,00 €");
    },
  );
});
