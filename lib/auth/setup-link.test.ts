import { describe, expect, test } from "bun:test";
import { parseSetupToken } from "./setup-link";

const ID = "3f2b8c1e-9a4d-4c2e-8b1f-2a6d9e0c7b55";
const SECRET = "a".repeat(43);

describe("parseSetupToken", () => {
  test("reads a well-formed token", () => {
    expect(parseSetupToken(`${ID}.${SECRET}`)).toEqual({ id: ID, secret: SECRET });
  });

  test("refuses anything that cannot be one of ours", () => {
    for (const bad of [
      "",
      ID,
      `${ID}.`,
      `.${SECRET}`,
      `${ID}.short`,
      `not-a-uuid.${SECRET}`,
      `${ID}.${SECRET}.extra`,
    ]) {
      expect(parseSetupToken(bad)).toBeNull();
    }
  });
});
