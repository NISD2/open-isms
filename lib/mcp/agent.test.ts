import { describe, expect, test } from "bun:test";
import { assistantAgent, assistantOf } from "./agent";

describe("assistantOf", () => {
  test("names the assistant behind the user agent it was given", () => {
    expect(assistantOf(assistantAgent("Claude Code (nisd2-local)"))).toBe(
      "Claude Code (nisd2-local)",
    );
  });

  test("a browser's change is the person's own", () => {
    expect(assistantOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBeNull();
    expect(assistantOf(null)).toBeNull();
  });
});
