import { describe, expect, test } from "bun:test";
import { centsFrom } from "./DemoCloseForm";

describe("centsFrom", () => {
  test("blank means the listed price", () => {
    expect(centsFrom("  ")).toBeNull();
  });

  test("German amounts: dots group thousands, a comma is the decimal mark", () => {
    expect(centsFrom("4.800")).toBe(480_000);
    expect(centsFrom("4.800,50")).toBe(480_050);
    expect(centsFrom("1.200.000")).toBe(120_000_000);
    expect(centsFrom("99,5")).toBe(9_950);
  });

  test("English decimals are not multiplied by a hundred", () => {
    expect(centsFrom("99.50")).toBe(9_950);
    expect(centsFrom("1200.5")).toBe(120_050);
    expect(centsFrom("4800")).toBe(480_000);
  });

  test("anything that is not a positive amount is invalid", () => {
    for (const bad of ["0", "-5", "abc", "4,8,0"]) expect(centsFrom(bad)).toBeNaN();
  });
});
