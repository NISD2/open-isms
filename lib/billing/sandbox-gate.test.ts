import { describe, expect, test } from "bun:test";
import { isSandboxHarnessEnabled } from "./sandbox-gate";

describe("isSandboxHarnessEnabled", () => {
  test("is off when nothing is configured, which is what a real deploy looks like", () => {
    expect(isSandboxHarnessEnabled({})).toBe(false);
  });

  test("is off for the production Qonto host", () => {
    expect(
      isSandboxHarnessEnabled({ QONTO_API_BASE: "https://thirdparty.qonto.com/v2" }),
    ).toBe(false);
  });

  test("is on only for the sandbox host", () => {
    expect(
      isSandboxHarnessEnabled({
        QONTO_API_BASE: "https://thirdparty-sandbox.staging.qonto.co/v2",
      }),
    ).toBe(true);
  });

  test("cannot be turned on by credentials alone", () => {
    // The point of the gate: having a login and a secret is not permission to bill anyone.
    expect(isSandboxHarnessEnabled({ QONTO_LOGIN: "x", QONTO_SECRET_KEY: "y" })).toBe(
      false,
    );
  });
});
