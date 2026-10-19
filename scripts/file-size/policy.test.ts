import { describe, expect, test } from "bun:test";
import {
  isOverLimit,
  report,
  splitAdvice,
  TOKEN_LIMIT,
  tokensOf,
  verdictOf,
} from "./policy";

const LIMIT_BYTES = TOKEN_LIMIT * 4;

describe("counting", () => {
  test("a token is four bytes, rounded up", () => {
    expect(tokensOf(0)).toBe(0);
    expect(tokensOf(1)).toBe(1);
    expect(tokensOf(4)).toBe(1);
    expect(tokensOf(5)).toBe(2);
  });

  test("the limit is 5,000 tokens: 20,000 bytes pass, one more byte does not", () => {
    expect(isOverLimit(LIMIT_BYTES)).toBe(false);
    expect(isOverLimit(LIMIT_BYTES + 1)).toBe(true);
  });
});

describe("the verdict on a file over the limit", () => {
  const over = LIMIT_BYTES + 400;

  test("a new file is too large", () => {
    expect(verdictOf({ path: "a.ts", bytes: over, previousBytes: null })).toEqual({
      kind: "too_large",
      tokens: tokensOf(over),
      previousTokens: null,
    });
  });

  test("a file that crosses the limit is too large", () => {
    expect(
      verdictOf({ path: "a.ts", bytes: over, previousBytes: LIMIT_BYTES }),
    ).toMatchObject({
      kind: "too_large",
      previousTokens: TOKEN_LIMIT,
    });
  });

  test("a file already over the limit may stay the same size or shrink", () => {
    expect(verdictOf({ path: "a.ts", bytes: over, previousBytes: over }).kind).toBe(
      "not_grown",
    );
    expect(verdictOf({ path: "a.ts", bytes: over, previousBytes: over + 1 }).kind).toBe(
      "not_grown",
    );
  });

  test("a file already over the limit may not grow, not even by one byte", () => {
    expect(verdictOf({ path: "a.ts", bytes: over + 1, previousBytes: over }).kind).toBe(
      "too_large",
    );
  });
});

describe("the advice", () => {
  test("names the steps for each kind of file", () => {
    expect(splitAdvice("lib/compliance/foo.test.ts")[0]).toContain("unit under test");
    expect(splitAdvice("server/trpc/routers/foo.ts")[0]).toContain("responsibility");
    expect(splitAdvice("components/Foo.tsx")[0]).toContain("responsibility");
    expect(splitAdvice("messages/durchgang/de.json").join(" ")).toContain(
      "i18n/request.ts",
    );
    expect(splitAdvice("data/changelog.json")[0]).toContain("top-level key");
    expect(splitAdvice("docs/legal-reference.md")[0]).toContain("section");
    expect(splitAdvice("courses/x/book.tex")[0]).toContain("concern");
  });

  test("treats only messages/<namespace>/<locale>.json as a message catalogue", () => {
    expect(splitAdvice("messages/a/b/c.json").join(" ")).not.toContain("i18n/request.ts");
  });
});

describe("the report", () => {
  test("is empty and passes when nothing is over the limit", () => {
    expect(report([])).toEqual({ failed: false, lines: [] });
  });

  test("passes with a note when an oversized file did not grow", () => {
    const result = report([
      { path: "big.json", verdict: { kind: "not_grown", tokens: 9000 } },
    ]);
    expect(result.failed).toBe(false);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toContain("9,000 tokens");
  });

  test("fails, names each file, and says how to split it", () => {
    const result = report([
      {
        path: "lib/new.ts",
        verdict: { kind: "too_large", tokens: 6000, previousTokens: null },
      },
      {
        path: "messages/info/de.json",
        verdict: { kind: "too_large", tokens: 9001, previousTokens: 9000 },
      },
    ]);
    const text = result.lines.join("\n");
    expect(result.failed).toBe(true);
    expect(text).toContain("2 files are over the 5,000-token limit");
    expect(text).toContain("lib/new.ts: 6,000 tokens (new file)");
    expect(text).toContain("was 9,000, and a file over the limit may not grow");
    expect(text).toContain("How to split lib/new.ts:");
    expect(text).toContain("How to split messages/info/de.json:");
    expect(text).toContain("linguist-generated");
  });
});
