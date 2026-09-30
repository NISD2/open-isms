/**
 * A company name reaches a mail sent to an address that company chose, so
 * nothing in it may become a link or a tap-to-call number in any mail client,
 * and a real name must not come out cut, because a cut sender name reads as
 * phishing too. Pinned on the shapes clients are known to link, and on the
 * real names that must survive.
 */
import { describe, expect, test } from "bun:test";
import { companyNameForMail } from "./sender-name";

const FALLBACK = "A supplier";
const clean = (name: string | null) => companyNameForMail(name, FALLBACK);

/**
 * What a client links or a reader follows, written independently of the
 * helper: a scheme, a mail address, a host name (a character, a dot, two
 * letters), an IPv4 address, six digits in one run of number punctuation, or a
 * defanged dot.
 */
const LINKABLE =
  /:\/\/|@|[^\s.\u{3002}\u{FF0E}][.\u{3002}\u{FF0E}]\p{L}{2}|\p{Nd}\.\p{Nd}+\.\p{Nd}+\.\p{Nd}|(?:\p{Nd}[\s\p{Pd}./()]*){6}|[[(]\s*(?:\.|dot)\s*[\])]/iu;

const ATTACKS: ReadonlyArray<readonly [string, string, string]> = [
  ["a bare domain", "ACME secure-login.example GmbH", "ACME secure-login. example GmbH"],
  ["a scheme", "ACME https://x.test/reset", "ACME"],
  ["a www host", "ACME www.acme-support.test", "ACME www. acme-support. test"],
  ["a path on a host", "ACME acme.test/login", "ACME acme. test/login"],
  ["a mail address", "ACME support@acme.test", "ACME"],
  ["a short IPv4 address", "ACME 10.0.0.1 GmbH", "ACME GmbH"],
  ["a long IPv4 address", "ACME 203.0.113.7 GmbH", "ACME GmbH"],
  ["a punycode domain", "ACME xn--80ak6aa92e.xn--p1ai", "ACME xn--80ak6aa92e. xn--p1ai"],
  ["a domain in brackets", "ACME (acme.test)", "ACME (acme. test)"],
  ["fullwidth dots", "ACME acme\u{FF0E}test", "ACME acme. test"],
  ["an ideographic dot", "ACME acme\u{3002}test", "ACME acme\u{3002} test"],
  ["a zero-width space hiding the dot", "ACME acme\u{200B}.test", "ACME acme. test"],
  ["a soft hyphen before the dot", "ACME acme\u{AD}.test", "ACME acme. test"],
  ["a bracketed dot", "ACME evil[.]com", "ACME"],
  ["a spelled dot", "ACME evil(dot)com", "ACME"],
  ["a phone number with spaces", "ACME Rückruf 030 1234 5678", "ACME Rückruf"],
  ["a dialling code", "ACME Hotline +49 (30) 1234-5678 GmbH", "ACME Hotline GmbH"],
  ["a number with slash and dots", "ACME 030/123.456", "ACME"],
  ["a number in one piece", "ACME 0301234567", "ACME"],
];

describe("companyNameForMail", () => {
  test.each(ATTACKS)("defuses %s", (_label, name, expected) => {
    expect(clean(name)).toBe(expected);
  });

  test.each(ATTACKS)("leaves nothing linkable after %s", (_label, name) => {
    expect(clean(name)).not.toMatch(LINKABLE);
  });

  test("the linkability check itself catches every attack as typed", () => {
    for (const [, name] of ATTACKS) expect(name).toMatch(LINKABLE);
  });

  test.each([
    "Stadtwerke Musterstadt GmbH",
    "DRK Kreisverband Aachen e.V.",
    "Müller & Söhne GmbH & Co. KG",
    "J.P. Beispiel AG",
    "1&1 Beispiel SE",
    "Stadtwerke 2000 GmbH",
    "Hausnummer 12345 AG",
  ])("keeps the real name %s", (name) => {
    expect(clean(name)).toBe(name);
  });

  test.each([
    ["Müller GmbH & Co.KG", "Müller GmbH & Co. KG"],
    ["Gebr.Müller KG", "Gebr. Müller KG"],
    ["Dr.Oetker", "Dr. Oetker"],
  ])("keeps %s whole, with a space after the dot", (name, expected) => {
    expect(clean(name)).toBe(expected);
  });

  test("turns line breaks into spaces, so a name cannot start a second line", () => {
    expect(clean("ACME\r\nGmbH")).toBe("ACME GmbH");
  });

  test("drops bidi overrides, so a name reads in the order it was typed", () => {
    expect(clean("ACME \u{202E}HbmG")).toBe("ACME HbmG");
  });

  test("caps the length so a name cannot carry a paragraph", () => {
    const result = clean(`ACME ${"Wort ".repeat(40)}`);
    expect(Array.from(result).length).toBeLessThanOrEqual(81);
    expect(result.endsWith("\u{2026}")).toBe(true);
  });

  test("falls back when nothing is left, or nothing was there", () => {
    expect(clean("https://acme.test")).toBe(FALLBACK);
    expect(clean("   ")).toBe(FALLBACK);
    expect(clean(null)).toBe(FALLBACK);
  });
});
