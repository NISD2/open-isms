import { describe, expect, test } from "bun:test";
import { localCallbackPath } from "./local-path";

const FALLBACK = "/journey";

describe("localCallbackPath", () => {
  test("keeps a local path with its query and hash", () => {
    expect(localCallbackPath("/de/portal?tab=assets#top", FALLBACK)).toBe(
      "/de/portal?tab=assets#top",
    );
  });

  test("falls back when there is no callback or it does not parse", () => {
    expect(localCallbackPath(null, FALLBACK)).toBe(FALLBACK);
    expect(localCallbackPath("http://[", FALLBACK)).toBe(FALLBACK);
  });

  test("refuses anything that leaves the origin", () => {
    const offsite = [
      "https://evil.invalid",
      "//evil.invalid",
      "/\\evil.invalid",
      "\\\\evil.invalid",
      "/\t/evil.invalid",
      "/\n/evil.invalid",
      "javascript:alert(1)",
      "data:text/html,x",
      "http://local.invalid.evil.invalid/",
    ];
    for (const raw of offsite) {
      expect(localCallbackPath(raw, FALLBACK)).toBe(FALLBACK);
    }
  });
});
