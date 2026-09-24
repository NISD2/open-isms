import { describe, expect, test } from "bun:test";
import { formatIban, isValidIban, pickPayableAccount } from "./iban";

describe("isValidIban", () => {
  test("accepts real IBANs, including the sandbox German test account", () => {
    for (const i of [
      "DE77533700080111111100",
      "DE89370400440532013000",
      "NL91ABNA0417164300",
      "FR1420041010050500013M02606",
    ]) {
      expect(isValidIban(i)).toBe(true);
    }
  });

  test("rejects the masked placeholder the Qonto sandbox returns", () => {
    // This is the exact shape that reached the invoice endpoint and came back as a 422.
    expect(isValidIban("FRXX10096000508795191Q719")).toBe(false);
  });

  test("rejects a wrong checksum, a wrong length and rubbish", () => {
    expect(isValidIban("DE89370400440532013001")).toBe(false);
    expect(isValidIban("DE8937040044053201300")).toBe(false);
    expect(isValidIban("")).toBe(false);
    expect(isValidIban("not an iban")).toBe(false);
  });

  test("ignores the spaces people paste in", () => {
    expect(isValidIban("DE89 3704 0044 0532 0130 00")).toBe(true);
  });
});

describe("pickPayableAccount", () => {
  test("never picks an account whose IBAN cannot be paid into", () => {
    const picked = pickPayableAccount([
      { iban: "FRXX10096000508795191Q719", name: "Compte principal", status: "active" },
      { iban: "DE77533700080111111100", name: "Main-TestAccount", status: "active" },
    ]);
    expect(picked?.name).toBe("Main-TestAccount");
  });

  test("prefers an active account, but takes a valid inactive one over nothing", () => {
    expect(
      pickPayableAccount([
        { iban: "DE89370400440532013000", name: "closed", status: "closed" },
        { iban: "DE77533700080111111100", name: "open", status: "active" },
      ])?.name,
    ).toBe("open");
    expect(
      pickPayableAccount([
        { iban: "DE89370400440532013000", name: "closed", status: "closed" },
      ])?.name,
    ).toBe("closed");
  });

  test("returns null rather than something unusable", () => {
    expect(pickPayableAccount([])).toBeNull();
    expect(
      pickPayableAccount([{ iban: "FRXX10096000508795191Q719", status: "active" }]),
    ).toBeNull();
    expect(pickPayableAccount([{ name: "no iban at all", status: "active" }])).toBeNull();
  });
});

describe("formatIban", () => {
  test("groups in fours so a person can read it back", () => {
    expect(formatIban("DE77533700080111111100")).toBe("DE77 5337 0008 0111 1111 00");
  });
});
