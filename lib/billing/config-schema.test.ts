import { describe, expect, test } from "bun:test";
import {
  billingEnvSchema,
  QONTO_PRODUCTION_BASE,
  VIES_DEFAULT_ENDPOINT,
} from "./config-schema";

const parse = (env: Record<string, string>) => billingEnvSchema.parse(env);

describe("billing settings", () => {
  test("defaults apply when a key is missing", () => {
    expect(parse({})).toMatchObject({
      QONTO_API_BASE: QONTO_PRODUCTION_BASE,
      INVOICE_PREFIX: "RE",
      VIES_ENDPOINT: VIES_DEFAULT_ENDPOINT,
    });
  });

  test("an empty or whitespace-only value counts as missing", () => {
    for (const blank of ["", "   "]) {
      const s = parse({
        QONTO_API_BASE: blank,
        INVOICE_PREFIX: blank,
        VIES_ENDPOINT: blank,
        QONTO_LOGIN: blank,
      });
      expect(s.QONTO_API_BASE).toBe(QONTO_PRODUCTION_BASE);
      expect(s.INVOICE_PREFIX).toBe("RE");
      expect(s.VIES_ENDPOINT).toBe(VIES_DEFAULT_ENDPOINT);
      expect(s.QONTO_LOGIN).toBeUndefined();
    }
  });

  test("values are trimmed, and the prefix is uppercased", () => {
    expect(parse({ INVOICE_PREFIX: " re " }).INVOICE_PREFIX).toBe("RE");
    expect(parse({ QONTO_LOGIN: " x " }).QONTO_LOGIN).toBe("x");
  });

  test("a wrong value never fails validation, so it cannot stop the application starting", () => {
    expect(() =>
      parse({ QONTO_API_BASE: "not a url", INVOICE_PREFIX: "NO-GOOD!" }),
    ).not.toThrow();
  });
});
