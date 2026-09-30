import { describe, expect, test } from "bun:test";
import { localCallbackPath } from "./local-path";

const FALLBACK = "/journey";
const PAGE = "https://nisd2.eu/de/auth/signin";

describe("localCallbackPath", () => {
  test("keeps a local path with its query and hash", () => {
    expect(localCallbackPath("/de/portal?tab=assets#top", FALLBACK)).toBe(
      "/de/portal?tab=assets#top",
    );
  });

  test("falls back when there is no callback or it does not parse", () => {
    expect(localCallbackPath(null, FALLBACK)).toBe(FALLBACK);
    expect(localCallbackPath("", FALLBACK)).toBe(FALLBACK);
    expect(localCallbackPath("http://[", FALLBACK)).toBe(FALLBACK);
  });

  // The property that matters is where the browser ends up, so each result is
  // resolved against the real sign-in page rather than compared to a string.
  test("never returns anything that resolves off the origin", () => {
    const offsite = [
      "https://evil.invalid",
      "//evil.invalid",
      "/\\evil.invalid",
      "\\\\evil.invalid",
      "/\t/evil.invalid",
      "/\n/evil.invalid",
      "/.//evil.invalid",
      "/..//evil.invalid",
      "/%2e//evil.invalid",
      "/%2E%2E//evil.invalid",
      "/de/%2e%2e//evil.invalid/x",
      "/././/evil.invalid",
      "/.\\/evil.invalid",
      "/..\\\\evil.invalid",
      "javascript:alert(1)",
      "data:text/html,x",
      "http://local.invalid.evil.invalid/",
    ];
    for (const raw of offsite) {
      const out = localCallbackPath(raw, FALLBACK);
      expect(new URL(out, PAGE).origin).toBe("https://nisd2.eu");
    }
  });
});
