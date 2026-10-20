import { describe, expect, test } from "bun:test";
import { holderRefusal, type PersonRow } from "./holder";

const claims = { ver: 3, sv: 7 };
const person: PersonRow = {
  email: "ops@example.org",
  emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
  mcpKeyVersion: 3,
  sessionVersion: 7,
};
const operators = (email: string) => email === "ops@example.org";

describe("whether a key still stands", () => {
  test("opens for a verified operator whose versions match", () => {
    expect(holderRefusal(claims, person, operators)).toBeNull();
  });

  test("is refused for a person who is gone or has no address", () => {
    expect(holderRefusal(claims, undefined, operators)).toBe("no such person");
    expect(holderRefusal(claims, { ...person, email: null }, operators)).toBe(
      "no such person",
    );
  });

  test("is refused when the address was never verified", () => {
    expect(holderRefusal(claims, { ...person, emailVerifiedAt: null }, operators)).toBe(
      "address not verified",
    );
  });

  test("is refused after the person disconnected their assistants", () => {
    expect(holderRefusal(claims, { ...person, mcpKeyVersion: 4 }, operators)).toBe(
      "assistants were disconnected",
    );
  });

  test("is refused after the person signed out", () => {
    expect(holderRefusal(claims, { ...person, sessionVersion: 8 }, operators)).toBe(
      "signed out since",
    );
  });

  test("is refused when the address left the operator list", () => {
    expect(holderRefusal(claims, person, () => false)).toBe("not an operator");
  });

  test("is refused for a customer with a valid key of their own account", () => {
    const customer = { ...person, email: "customer@example.org" };
    expect(holderRefusal(claims, customer, operators)).toBe("not an operator");
  });
});
