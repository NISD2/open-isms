import { describe, expect, test } from "bun:test";
import { isSandboxBase } from "./sandbox-gate";

describe("isSandboxBase", () => {
  test("is false for the production Qonto host, which is what a real deploy looks like", () => {
    expect(isSandboxBase("https://thirdparty.qonto.com/v2")).toBe(false);
  });

  test("is true only for the sandbox host over https", () => {
    expect(isSandboxBase("https://thirdparty-sandbox.staging.qonto.co/v2")).toBe(true);
  });

  test("is not fooled by a URL that only contains the sandbox name", () => {
    for (const base of [
      "https://proxy.example/thirdparty-sandbox.staging.qonto.co/v2",
      "https://thirdparty-sandbox.staging.qonto.co.attacker.example/v2",
      "thirdparty-sandbox.staging.qonto.co",
      "",
    ]) {
      expect(isSandboxBase(base)).toBe(false);
    }
  });

  test("refuses plain http, because credentials travel in the headers", () => {
    expect(isSandboxBase("http://thirdparty-sandbox.staging.qonto.co/v2")).toBe(false);
  });
});
