import { describe, expect, test } from "bun:test";
import { checkStructure, structuralMessage } from "./vat-checksum";

describe("German check digit", () => {
  test("accepts German VAT numbers with a correct check digit", () => {
    // Synthetic numbers whose last digit is the MOD 11,10 check digit of the first eight. No real
    // company's number is kept in the repository.
    for (const n of ["123456788", "234567894", "345678906"]) {
      expect(checkStructure("DE", n)).toEqual({
        ok: true,
        countryCode: "DE",
        verified: "checksum",
      });
    }
  });

  test("rejects a single altered digit, which is the failure that actually happens", () => {
    const r = checkStructure("DE", "345678900");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.reason).toBe("checksum");
  });

  test("rejects every single-digit corruption of a valid number", () => {
    const good = "123456788";
    const corruptions = [...good].flatMap((original, i) =>
      [..."0123456789"]
        .filter((digit) => digit !== original)
        .map((digit) => good.slice(0, i) + digit + good.slice(i + 1)),
    );
    const missed = corruptions.filter((c) => checkStructure("DE", c).ok);
    // A MOD 11,10 check digit catches every single-digit error by construction. If this ever
    // regresses, the algorithm has been broken rather than merely weakened, and the failure
    // names the exact numbers that slipped through.
    expect(corruptions).toHaveLength(81);
    expect(missed).toEqual([]);
  });

  test("rejects the wrong length before doing any arithmetic", () => {
    for (const n of ["12345678", "1234567880", "", "12345678X"]) {
      const r = checkStructure("DE", n);
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error("unreachable");
      expect(r.reason).toBe("format");
    }
  });
});

describe("other member states are format-checked and say so", () => {
  test("a well-formed Dutch number passes as format_only, not as checksum", () => {
    expect(checkStructure("NL", "123456789B01")).toEqual({
      ok: true,
      countryCode: "NL",
      verified: "format_only",
    });
  });

  test("the country-specific shapes are enforced", () => {
    expect(checkStructure("NL", "123456789").ok).toBe(false);
    expect(checkStructure("AT", "U12345678").ok).toBe(true);
    expect(checkStructure("AT", "12345678").ok).toBe(false);
    expect(checkStructure("IT", "12345678901").ok).toBe(true);
    expect(checkStructure("IT", "1234567890").ok).toBe(false);
  });

  test("a country that issues no VAT numbers is a format failure", () => {
    expect(checkStructure("US", "123456789").ok).toBe(false);
    expect(checkStructure("CH", "123456789").ok).toBe(false);
  });
});

describe("the message shown to a person", () => {
  test("says nothing when the number is fine", () => {
    expect(structuralMessage(checkStructure("DE", "123456788"))).toBeNull();
  });

  test("distinguishes a wrong shape from a wrong digit, and blames neither the person nor fraud", () => {
    const format = structuralMessage(checkStructure("DE", "123"));
    const checksum = structuralMessage(checkStructure("DE", "345678900"));
    expect(format).toContain("country prefix");
    expect(checksum).toContain("digit wrong");
    for (const m of [format, checksum]) {
      expect(m?.toLowerCase()).not.toContain("invalid");
      expect(m?.toLowerCase()).not.toContain("error");
    }
  });
});
