import { describe, expect, test } from "bun:test";
import { dpoOf } from "./dpo";
import { dataProtectionOfficerText } from "./policy";

describe("the data protection officer as G-DPO.1 recorded it", () => {
  test("is open until the decision is given", () => {
    expect(dpoOf({})).toEqual({ kind: "open" });
    expect(dpoOf({ dpoName: "Anna Beispiel" })).toEqual({ kind: "open" });
  });

  test("names nobody where the company designates none, whatever the fields still hold", () => {
    const none = dpoOf({ dpoDecision: "none", dpoName: "Anna Beispiel" });
    expect(none).toEqual({ kind: "none" });
  });

  test("is designated, required or voluntarily, with what was given", () => {
    const voluntary = dpoOf({
      dpoDecision: "voluntary",
      dpoName: " Anna Beispiel ",
      dpoContact: "",
    });
    expect(voluntary).toEqual({
      kind: "designated",
      name: "Anna Beispiel",
      contact: null,
    });
    expect(dpoOf({ dpoDecision: "required" })).toEqual({
      kind: "designated",
      name: null,
      contact: null,
    });
  });

  test("reads an answer that does not parse as not answered", () => {
    expect(dpoOf({ dpoDecision: "maybe" })).toEqual({ kind: "open" });
  });

  test("the documents and the record read it the same way", () => {
    const designated = dpoOf({
      dpoDecision: "required",
      dpoName: "Muster Datenschutz GmbH, Anna Beispiel",
      dpoContact: "datenschutz@example.com",
    });
    expect(dataProtectionOfficerText("en", designated)).toBe(
      "Muster Datenschutz GmbH, Anna Beispiel (datenschutz@example.com)",
    );
    const none = dataProtectionOfficerText("en", dpoOf({ dpoDecision: "none" }));
    expect(none).not.toContain("Anna");
  });
});
