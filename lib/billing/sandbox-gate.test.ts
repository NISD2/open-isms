import { describe, expect, test } from "bun:test";
import { isSandboxHarnessEnabled } from "./sandbox-gate";

const on = (QONTO_API_BASE: string) => isSandboxHarnessEnabled({ QONTO_API_BASE });

describe("isSandboxHarnessEnabled", () => {
  test("is off for the production Qonto host, which is what a real deploy looks like", () => {
    expect(on("https://thirdparty.qonto.com/v2")).toBe(false);
  });

  test("is on only for the sandbox host over https", () => {
    expect(on("https://thirdparty-sandbox.staging.qonto.co/v2")).toBe(true);
  });

  test("is not fooled by a URL that only contains the sandbox name", () => {
    for (const base of [
      "https://proxy.example/thirdparty-sandbox.staging.qonto.co/v2",
      "https://thirdparty-sandbox.staging.qonto.co.attacker.example/v2",
      "thirdparty-sandbox.staging.qonto.co",
      "",
    ]) {
      expect(on(base)).toBe(false);
    }
  });

  test("refuses plain http, because credentials travel in the headers", () => {
    expect(on("http://thirdparty-sandbox.staging.qonto.co/v2")).toBe(false);
  });
});
