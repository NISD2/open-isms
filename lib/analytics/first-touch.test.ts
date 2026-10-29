import { describe, expect, test } from "bun:test";
import { createFirstTouch } from "./first-touch";

describe("createFirstTouch", () => {
  test("keeps the campaign tags of the first page, however the address changes after", () => {
    let address = "?utm_source=linkedin&utm_medium=social&x=1";
    const firstTouch = createFirstTouch(() => address);

    expect(firstTouch()).toEqual({ utm_source: "linkedin", utm_medium: "social" });

    // A client-side navigation to a page whose query has no tags, then to one with other tags.
    address = "";
    expect(firstTouch()).toEqual({ utm_source: "linkedin", utm_medium: "social" });
    address = "?utm_source=newsletter";
    expect(firstTouch()).toEqual({ utm_source: "linkedin", utm_medium: "social" });
  });

  test("reads the address once, and nothing but campaign tags survives", () => {
    let reads = 0;
    const firstTouch = createFirstTouch(() => {
      reads += 1;
      return "?token=secret&callbackUrl=%2Finvite%2F5f0c&utm_term=nis2";
    });
    firstTouch();
    firstTouch();
    expect(reads).toBe(1);
    expect(firstTouch()).toEqual({ utm_term: "nis2" });
  });

  test("a first page without tags holds none, and a later page does not add its own", () => {
    let address = "";
    const firstTouch = createFirstTouch(() => address);
    expect(firstTouch()).toEqual({});
    address = "?utm_source=late";
    expect(firstTouch()).toEqual({});
  });

  test("each document starts empty: two holders do not share what they hold", () => {
    const one = createFirstTouch(() => "?utm_source=a");
    const two = createFirstTouch(() => "?utm_source=b");
    expect(one()).toEqual({ utm_source: "a" });
    expect(two()).toEqual({ utm_source: "b" });
  });
});
