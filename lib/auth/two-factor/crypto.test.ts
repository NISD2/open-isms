/**
 * The app secret is stored encrypted and authenticated: only the key that wrote it reads it back,
 * and a changed value reads as nothing rather than as a different secret.
 */
import { describe, expect, mock, test } from "bun:test";
import { randomBytes } from "node:crypto";

const KEY = randomBytes(32);

// lib/env validates the environment at load, and CI runs this suite without one.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
    TWO_FACTOR_ENCRYPTION_KEY: KEY.toString("base64"),
  },
  mailSupportEmail: () => "support@example.test",
}));

const { decryptSecret, encryptSecret, twoFactorKey } = await import("./crypto");

describe("app secret encryption", () => {
  test("the configured key is read as 32 bytes", () => {
    expect(twoFactorKey()?.equals(KEY)).toBe(true);
  });

  test("what is written reads back with the same key", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY);
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(stored, KEY)).toBe("JBSWY3DPEHPK3PXP");
  });

  test("two writes of one secret differ, so equal secrets do not show", () => {
    expect(encryptSecret("A", KEY)).not.toBe(encryptSecret("A", KEY));
  });

  test("another key, a changed value or an unknown form read as nothing", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY);
    expect(decryptSecret(stored, randomBytes(32))).toBeNull();
    const [v, iv, tag, body] = stored.split(":");
    const flipped = Buffer.from(body, "base64");
    flipped[0] ^= 1;
    expect(
      decryptSecret([v, iv, tag, flipped.toString("base64")].join(":"), KEY),
    ).toBeNull();
    expect(decryptSecret("v2:a:b:c", KEY)).toBeNull();
    expect(decryptSecret("garbage", KEY)).toBeNull();
  });
});
