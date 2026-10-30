/**
 * The app secret is stored encrypted and authenticated: only the key that wrote it, for the person
 * it was written for, reads it back, and a changed value reads as nothing rather than as a
 * different secret.
 */
import { describe, expect, mock, test } from "bun:test";
import { randomBytes } from "node:crypto";

const KEY = randomBytes(32);
const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE_ELSE = "22222222-2222-4222-8222-222222222222";

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

  test("what is written reads back with the same key for the same person", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY, ME);
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(stored, KEY, ME)).toBe("JBSWY3DPEHPK3PXP");
  });

  test("two writes of one secret differ, so equal secrets do not show", () => {
    expect(encryptSecret("A", KEY, ME)).not.toBe(encryptSecret("A", KEY, ME));
  });

  test("a secret copied onto another person's row does not decrypt", () => {
    expect(
      decryptSecret(encryptSecret("JBSWY3DPEHPK3PXP", KEY, ME), KEY, SOMEONE_ELSE),
    ).toBeNull();
  });

  test("another key, a changed value, a cut tag or an unknown form read as nothing", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY, ME);
    expect(decryptSecret(stored, randomBytes(32), ME)).toBeNull();
    const [v, iv, tag, body] = stored.split(":");
    const flipped = Buffer.from(body, "base64");
    flipped[0] ^= 1;
    expect(
      decryptSecret([v, iv, tag, flipped.toString("base64")].join(":"), KEY, ME),
    ).toBeNull();
    // A four-byte tag would be accepted by a decipher that does not pin the length.
    const shortTag = Buffer.from(tag, "base64").subarray(0, 4).toString("base64");
    expect(decryptSecret([v, iv, shortTag, body].join(":"), KEY, ME)).toBeNull();
    expect(decryptSecret("v2:a:b:c", KEY, ME)).toBeNull();
    expect(decryptSecret("garbage", KEY, ME)).toBeNull();
  });
});
