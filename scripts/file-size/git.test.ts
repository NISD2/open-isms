import { describe, expect, test } from "bun:test";
import { parseCheckAttr, parseNameStatus } from "./git";

describe("parseNameStatus", () => {
  test("reads plain changes and renames from NUL-separated output", () => {
    const output = [
      "A",
      "new.ts",
      "M",
      "lib/a.ts",
      "R087",
      "old/b.ts",
      "new/b.ts",
      "",
    ].join("\0");
    expect(parseNameStatus(output)).toEqual([
      { path: "new.ts", from: "new.ts" },
      { path: "lib/a.ts", from: "lib/a.ts" },
      { path: "new/b.ts", from: "old/b.ts" },
    ]);
  });

  test("keeps paths with spaces, tabs and brackets intact", () => {
    const output = ["M", "app/[locale]/a b\tc.tsx", ""].join("\0");
    expect(parseNameStatus(output)).toEqual([
      { path: "app/[locale]/a b\tc.tsx", from: "app/[locale]/a b\tc.tsx" },
    ]);
  });

  test("reads nothing from empty output", () => {
    expect(parseNameStatus("")).toEqual([]);
  });
});

describe("parseCheckAttr", () => {
  test("returns the paths where an attribute is set, by name or as true", () => {
    const output = [
      "bun.lock",
      "linguist-generated",
      "set",
      "bun.lock",
      "linguist-vendored",
      "unspecified",
      "lib/a.ts",
      "linguist-generated",
      "unspecified",
      "data/x.json",
      "linguist-vendored",
      "true",
      "data/y.json",
      "linguist-generated",
      "false",
      "",
    ].join("\0");
    expect([...parseCheckAttr(output)].sort()).toEqual(["bun.lock", "data/x.json"]);
  });
});
