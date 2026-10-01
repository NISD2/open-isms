import { describe, expect, test } from "bun:test";
import { agreementsNote, declinedNote, loginsNote, noteLine, waitingNote } from "./notes";

describe("the notes trail", () => {
  test("dates a line by the Berlin calendar day, not the UTC one", () => {
    // 23:30 UTC on 30 September is already 1 October in Berlin (CEST, UTC+2).
    expect(noteLine(new Date("2026-09-30T23:30:00Z"), "x")).toBe("2026-10-01 x");
    expect(noteLine(new Date("2026-12-31T22:59:00Z"), "x")).toBe("2026-12-31 x");
  });

  test("keeps a typed note on one line", () => {
    expect(noteLine(new Date("2026-09-30T10:00:00Z"), "  erste\n\nZeile  ")).toBe(
      "2026-09-30 erste Zeile",
    );
  });

  test("keeps the reason for a decision not to do an item with it", () => {
    expect(declinedNote("de", "Kein eigener Server im Haus.")).toContain(
      "Begründung: Kein eigener Server im Haus.",
    );
  });

  test("leaves the note out when there is none", () => {
    expect(waitingNote("de", "Ich muss erst jemanden fragen", null)).toBe(
      "Geht noch nicht: Ich muss erst jemanden fragen.",
    );
  });

  test("names each supplier checked with what is agreed, or that nothing is", () => {
    expect(
      agreementsNote("en", [
        { name: "DATEV", security: false, incidents: true },
        { name: "Telekom", security: false, incidents: false },
      ]),
    ).toBe(
      "Agreements with suppliers checked: DATEV: incident reporting; Telekom: nothing agreed.",
    );
  });

  test("names each sign-in checked with whether it takes a second factor", () => {
    const rows = [
      { name: "Microsoft 365", mfa: true },
      { name: "VPN", mfa: false },
    ];
    expect(loginsNote("de", rows)).toBe(
      "Anmeldung geprüft: Microsoft 365: mit zweitem Faktor; VPN: nur Passwort.",
    );
    expect(loginsNote("en", rows)).toBe(
      "Sign-in checked: Microsoft 365: second factor; VPN: password only.",
    );
  });
});
