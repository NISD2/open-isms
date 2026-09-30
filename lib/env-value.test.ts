import { describe, expect, test } from "bun:test";
import { trimmed, withoutBlanks } from "./env-value";

describe("blank environment values", () => {
  test("what compose passes for a variable left out counts as unset", () => {
    const env = withoutBlanks({
      AWS_S3_INTERNAL_ENDPOINT: "",
      INDEXNOW_KEY: "",
      SMTP_PORT: "   ",
      AWS_S3_ENDPOINT: "https://storage.example.org",
    });
    expect(env.AWS_S3_INTERNAL_ENDPOINT).toBeUndefined();
    expect(env.INDEXNOW_KEY).toBeUndefined();
    expect(env.SMTP_PORT).toBeUndefined();
    // So the server's S3 address falls back to the public one instead of to AWS.
    expect(env.AWS_S3_INTERNAL_ENDPOINT ?? env.AWS_S3_ENDPOINT).toBe(
      "https://storage.example.org",
    );
  });

  test("a set value passes through untouched, surrounding spaces included", () => {
    expect(withoutBlanks({ SMTP_PASSWORD: " pass word " }).SMTP_PASSWORD).toBe(
      " pass word ",
    );
  });

  test("trimmed trims and treats blank as unset", () => {
    expect(trimmed("  RE ")).toBe("RE");
    expect(trimmed("  ")).toBeUndefined();
    expect(trimmed(undefined)).toBeUndefined();
  });
});
