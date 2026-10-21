import { describe, expect, test } from "bun:test";
import { assistantAgent, assistantOf, browserAgent, viaOf } from "./agent";

describe("assistantOf", () => {
  test("names the assistant behind the user agent it was given", () => {
    expect(assistantOf(assistantAgent("Claude Code (nisd2-local)", "curl/8"))).toBe(
      "Claude Code (nisd2-local)",
    );
    expect(assistantOf(assistantAgent(undefined, "claude-code/2.1"))).toBe(
      "claude-code/2.1",
    );
  });

  test("a key that sends no name and an empty user agent still reads as an assistant", () => {
    for (const userAgent of ["", "   ", null]) {
      expect(assistantOf(assistantAgent(undefined, userAgent))).toBe("key");
    }
  });

  test("a user agent shows as a name: printable, and no longer than a name may be", () => {
    expect(assistantOf(assistantAgent(undefined, "Claude‮ edoC\nGeschäftsführung"))).toBe(
      "Claude edoCGeschäftsführung",
    );
    expect(assistantOf(assistantAgent(undefined, "x".repeat(5000)))).toHaveLength(100);
  });

  test("a browser's change is the person's own", () => {
    expect(assistantOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBeNull();
    expect(assistantOf(null)).toBeNull();
  });

  test("a browser that sends an assistant's prefix still reads as the person", () => {
    expect(assistantOf(browserAgent("mcp: Claude"))).toBeNull();
    expect(assistantOf(browserAgent("mcp: mcp: Claude"))).toBeNull();
    expect(browserAgent("Mozilla/5.0")).toBe("Mozilla/5.0");
    expect(browserAgent(null)).toBeNull();
  });

  test("a row is marked MCP exactly when a key made it", () => {
    expect(viaOf(assistantAgent("Claude", "anything"))).toBe("mcp");
    expect(viaOf(assistantAgent(undefined, null))).toBe("mcp");
    expect(viaOf("Mozilla/5.0")).toBe("app");
    expect(viaOf(null)).toBe("app");
    expect(viaOf(browserAgent("mcp: Claude"))).toBe("app");
  });
});
