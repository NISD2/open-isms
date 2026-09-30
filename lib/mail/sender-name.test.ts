/**
 * A company name reaches a mail sent to an address that company chose, so
 * nothing in it may become a link in any mail client. Pinned on the shapes
 * clients are known to link, and on the real names that must survive.
 */
import { describe, expect, test } from "bun:test";
import { companyNameForMail } from "./sender-name";

const FALLBACK = "A supplier";
const clean = (name: string | null) => companyNameForMail(name, FALLBACK);

describe("companyNameForMail", () => {
  test.each([
    ["a bare domain", "ACME secure-login.example GmbH", "ACME GmbH"],
    ["a scheme", "ACME https://x.test/reset", "ACME"],
    ["a www host", "ACME www.acme-support.test", "ACME"],
    ["a path on a host", "ACME acme.test/login?u=1", "ACME"],
    ["a mail address", "ACME support@acme.test", "ACME"],
    ["an IPv4 address", "ACME 203.0.113.7 GmbH", "ACME GmbH"],
    ["a punycode domain", "ACME xn--80ak6aa92e.xn--p1ai", "ACME"],
    ["a domain in brackets", "ACME (acme.test)", "ACME"],
    ["fullwidth dots", "ACME acme．test", "ACME"],
    ["an ideographic dot", "ACME acme。test", "ACME"],
    ["a zero-width space hiding the dot", "ACME acme​.test", "ACME"],
    ["a soft hyphen before the dot", "ACME acme­.test", "ACME"],
  ])("removes %s", (_label, name, expected) => {
    expect(clean(name)).toBe(expected);
  });

  test.each([
    "Stadtwerke Musterstadt GmbH",
    "DRK Kreisverband Aachen e.V.",
    "Müller & Söhne GmbH & Co. KG",
    "J.P. Beispiel AG",
    "1&1 Beispiel SE",
  ])("keeps the real name %s", (name) => {
    expect(clean(name)).toBe(name);
  });

  test("turns line breaks into spaces, so a name cannot start a second line", () => {
    expect(clean("ACME\r\nGmbH")).toBe("ACME GmbH");
  });

  test("drops bidi overrides, so a name reads in the order it was typed", () => {
    expect(clean("ACME ‮HbmG")).toBe("ACME HbmG");
  });

  test("caps the length so a name cannot carry a paragraph", () => {
    const long = `ACME ${"Wort ".repeat(40)}`;
    const result = clean(long);
    expect(Array.from(result).length).toBeLessThanOrEqual(81);
    expect(result.endsWith("…")).toBe(true);
  });

  test("falls back when nothing is left, or nothing was there", () => {
    expect(clean("https://acme.test")).toBe(FALLBACK);
    expect(clean("   ")).toBe(FALLBACK);
    expect(clean(null)).toBe(FALLBACK);
  });
});
