/**
 * Container logs are outside anything GDPR erasure can reach, so a log line
 * names the domain and a short hash of an address, never the address.
 */
import { describe, expect, test } from "bun:test";
import { maskAddress, maskAddressesIn } from "./mask-address";

describe("maskAddress", () => {
  test("keeps the domain and hides the person", () => {
    const masked = maskAddress("anna.muster@kunde.de");
    expect(masked).toMatch(/^\[[0-9a-f]{8}\]@kunde\.de$/);
    expect(masked).not.toContain("anna");
  });

  test("gives one address one mask, however it is written", () => {
    expect(maskAddress(" Anna.Muster@Kunde.de ")).toBe(
      maskAddress("anna.muster@kunde.de"),
    );
    expect(maskAddress("bernd@kunde.de")).not.toBe(maskAddress("anna.muster@kunde.de"));
  });
});

describe("maskAddressesIn", () => {
  test("masks every address in an operator alert", () => {
    const text =
      "Zugangslink an anna@kunde.de nicht gesendet\nRechnung an buchhaltung@kunde.de.";
    const masked = maskAddressesIn(text);
    expect(masked).not.toContain("anna@");
    expect(masked).not.toContain("buchhaltung@");
    expect(masked).toContain(`${maskAddress("buchhaltung@kunde.de")}.`);
  });

  test("masks a joined recipient list and a bracketed transport error", () => {
    expect(maskAddressesIn("a@x.de, b@y.de")).toBe(
      `${maskAddress("a@x.de")}, ${maskAddress("b@y.de")}`,
    );
    expect(maskAddressesIn("550 5.1.1 <anna@kunde.de>: Recipient address rejected")).toBe(
      `550 5.1.1 <${maskAddress("anna@kunde.de")}>: Recipient address rejected`,
    );
  });

  test("leaves text without an address as it was", () => {
    const id = "33333333-3333-4333-8333-333333333333";
    expect(maskAddressesIn(id)).toBe(id);
    expect(maskAddressesIn("unknown recipient")).toBe("unknown recipient");
  });

  test("does not mask an already masked address again", () => {
    const once = maskAddressesIn("to anna@kunde.de");
    expect(maskAddressesIn(once)).toBe(once);
  });
});
