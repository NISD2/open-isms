import { describe, expect, test } from "bun:test";
import { displayableFirstName } from "./first-name";

describe("displayableFirstName", () => {
  test("takes the first token of a real name", () => {
    expect(displayableFirstName("Simon Orzel")).toBe("Simon");
    expect(displayableFirstName("  Anna-Lena Schmidt ")).toBe("Anna-Lena");
  });

  test("raises the initial of lower-cased names", () => {
    expect(displayableFirstName("simon")).toBe("Simon");
  });

  test("rejects email local parts and other non-names", () => {
    expect(displayableFirstName("j.mueller")).toBeNull();
    expect(displayableFirstName("info42")).toBeNull();
    expect(displayableFirstName("a@b")).toBeNull();
    expect(displayableFirstName(null)).toBeNull();
    expect(displayableFirstName("  ")).toBeNull();
  });
});
