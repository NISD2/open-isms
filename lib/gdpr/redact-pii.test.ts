/**
 * The redaction helper decides what survives a GDPR erasure, and since it is
 * now applied to every frozen sign-off snapshot in a company, an over-match
 * rewrites a different employee's compliance evidence. A snapshot is meant to
 * be the immutable record of what was signed, so these cases are about what it
 * must NOT touch as much as what it must.
 */
import { describe, expect, test } from "bun:test";
import { redactPiiInJson } from "./redact-pii";

describe("redactPiiInJson", () => {
  test("redacts the subject's own name and email", () => {
    expect(
      redactPiiInJson({ cisoName: "Anna Muster", mail: "anna@kunde.de" }, [
        "Anna Muster",
        "anna@kunde.de",
      ]),
    ).toEqual({ cisoName: "[erased]", mail: "[erased]" });
  });

  // The regression: a bare substring match on a short common name.
  test("leaves unrelated words containing the name alone", () => {
    const untouched = { ort: "Bottrop", teil: "Schrott", firma: "Ottomotor GmbH" };
    expect(redactPiiInJson(untouched, ["Otto"])).toEqual(untouched);
  });

  test("still matches that name where it stands on its own", () => {
    expect(
      redactPiiInJson({ owner: "Otto Kern", note: "von Otto geprüft" }, ["Otto"]),
    ).toEqual({ owner: "[erased] Kern", note: "von [erased] geprüft" });
  });

  // \b is ASCII-only in JS, so it treats "ü" as a boundary and "Müller" would
  // fail to match itself. The explicit letter class is why.
  test("handles German umlauts at the word edges", () => {
    expect(redactPiiInJson({ a: "Müller", b: "Zimmermüller" }, ["Müller"])).toEqual({
      a: "[erased]",
      b: "Zimmermüller",
    });
  });

  test("reports names too short to bound instead of applying them", () => {
    const skipped: string[] = [];
    expect(redactPiiInJson({ x: "Bo war hier" }, ["Bo"], { skipped })).toEqual({
      x: "Bo war hier",
    });
    expect(skipped).toEqual(["Bo"]);
  });

  test("emails have no length floor and match mid-string", () => {
    expect(redactPiiInJson({ s: "kontakt:a@b.de;" }, ["a@b.de"])).toEqual({
      s: "kontakt:[erased];",
    });
  });

  test("walks nested structures and arrays", () => {
    expect(
      redactPiiInJson({ team: [{ lead: "Anna Muster" }, { lead: "Bernd Schwieger" }] }, [
        "Anna Muster",
      ]),
    ).toEqual({ team: [{ lead: "[erased]" }, { lead: "Bernd Schwieger" }] });
  });
});
