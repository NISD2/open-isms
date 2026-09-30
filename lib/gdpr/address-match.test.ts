/**
 * Erasing anna@web.de used to rewrite every string that contained it:
 * hanna@web.de became "h[erased]", susanna@web.de "sus[erased]" and
 * anna@web.de.example.org "[erased].example.org", in every tenant's audit
 * rows, with no way back. The address now matches only as a whole address.
 */
import { describe, expect, test } from "bun:test";
import { addressSpans, mentionsAddress, replaceAddress } from "./address-match";

const ANNA = "anna@web.de";
const erase = (text: string) => replaceAddress(text, ANNA, "[erased]");

describe("replaceAddress", () => {
  test.each([
    ["another person's longer local part", "hanna@web.de"],
    ["another person's local part ending in it", "susanna@web.de"],
    ["a longer domain", "anna@web.de.example.org"],
    ["a local part continued with a dot", "x.anna@web.de"],
    ["a domain continued with a hyphen", "anna@web.de-mail.com"],
    ["a domain continued with letters", "anna@web.dex"],
  ])("leaves %s untouched", (_, text) => {
    expect(erase(text)).toBe(text);
    expect(erase(`Invited ${text} today`)).toBe(`Invited ${text} today`);
  });

  // RFC local-part characters before it make a different, real address.
  test.each(["o'anna@web.de", "x=anna@web.de", "x/anna@web.de"])(
    "leaves %s untouched",
    (text) => {
      expect(erase(text)).toBe(text);
    },
  );

  // None of these can be part of an address, and the erased person's own
  // address stands between them in real text.
  test.each([
    ["German quotes", "„anna@web.de“", "„[erased]“"],
    ["guillemets", "«anna@web.de»", "«[erased]»"],
    ["curly single quotes", "‘anna@web.de’", "‘[erased]’"],
    ["curly double quotes", "“anna@web.de”", "“[erased]”"],
    ["non-breaking spaces", "an anna@web.de geschickt", "an [erased] geschickt"],
    ["zero-width spaces", "​anna@web.de​", "​[erased]​"],
    ["a trailing ellipsis", "anna@web.de…", "[erased]…"],
  ])("replaces it between %s", (_, text, erased) => {
    expect(erase(text)).toBe(erased);
  });

  // Internationalized addresses exist, so a letter beyond ASCII still continues one.
  test("leaves an address continued by a non-ASCII letter untouched", () => {
    expect(erase("jöanna@web.de")).toBe("jöanna@web.de");
    expect(erase("anna@web.deä")).toBe("anna@web.deä");
    expect(erase("𝒜anna@web.de")).toBe("𝒜anna@web.de");
  });

  test("replaces the address alone", () => {
    expect(erase(ANNA)).toBe("[erased]");
  });

  test("replaces it in a sentence, before a comma or a full stop", () => {
    expect(erase("Sent to anna@web.de, then to bernd@web.de.")).toBe(
      "Sent to [erased], then to bernd@web.de.",
    );
    expect(erase("Last sent to anna@web.de.")).toBe("Last sent to [erased].");
  });

  test("replaces it in quotes, in angle brackets and in serialized JSON", () => {
    expect(erase('to "anna@web.de"')).toBe('to "[erased]"');
    expect(erase("550 5.1.1 <anna@web.de>: rejected")).toBe(
      "550 5.1.1 <[erased]>: rejected",
    );
    expect(erase('{"recipient":"anna@web.de"}')).toBe('{"recipient":"[erased]"}');
  });

  test("ignores case, and keeps the text around it as it was", () => {
    expect(erase("Kontakt: Anna@WEB.de (GF)")).toBe("Kontakt: [erased] (GF)");
  });

  test("replaces every whole occurrence and only those", () => {
    expect(erase("anna@web.de hanna@web.de anna@web.de")).toBe(
      "[erased] hanna@web.de [erased]",
    );
  });

  // A character that lowercases to two code units must not shift the match.
  test("keeps its place after a character whose lowercase is longer", () => {
    expect(erase("İ anna@web.de")).toBe("İ [erased]");
  });

  test("does nothing with a needle that is not an address", () => {
    expect(addressSpans("anna", "anna")).toEqual([]);
    expect(addressSpans("anything", "")).toEqual([]);
  });
});

describe("mentionsAddress", () => {
  test("finds the address in nested JSON", () => {
    expect(mentionsAddress({ a: [{ to: "anna@web.de" }] }, ANNA)).toBe(true);
  });

  test("does not count an address that merely contains it", () => {
    expect(mentionsAddress({ to: "hanna@web.de", note: "susanna@web.de" }, ANNA)).toBe(
      false,
    );
    expect(mentionsAddress("anna@web.de.example.org", ANNA)).toBe(false);
    expect(mentionsAddress(null, ANNA)).toBe(false);
  });
});
