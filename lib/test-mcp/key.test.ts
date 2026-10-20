import { describe, expect, test } from "bun:test";
import { mintKey, readKey, signingKey } from "@/lib/mcp/key";
import { mintTestKey, readTestKey, TEST_KEY_SECONDS, testSigningKey } from "./key";

const SUB = "11111111-1111-4111-8111-111111111111";
const NOW = 1_800_000_000;

describe("the key", () => {
  const key = testSigningKey("a".repeat(32));

  test("reads back what was minted, for four hours, with the sign-in version it was made at", () => {
    const token = mintTestKey(key, { sub: SUB, ver: 3, sv: 7 }, NOW);
    expect(readTestKey(key, token, NOW + 10)).toMatchObject({ sub: SUB, ver: 3, sv: 7 });
    expect(TEST_KEY_SECONDS).toBe(4 * 60 * 60);
    expect(readTestKey(key, token, NOW + TEST_KEY_SECONDS)).toBeNull();
  });

  test("a customer's assistant key is no test key, and the other way round", () => {
    const customerKey = signingKey("a".repeat(32));
    const customer = mintKey(
      customerKey,
      { sub: SUB, cid: SUB, ver: 1, con: SUB },
      "mcp",
      NOW,
      3600,
    );
    const test = mintTestKey(key, { sub: SUB, ver: 1, sv: 1 }, NOW);
    expect(readTestKey(key, customer, NOW + 1)).toBeNull();
    expect(readTestKey(customerKey, customer, NOW + 1)).toBeNull();
    expect(readKey(customerKey, test, "mcp", NOW + 1)).toBeNull();
    expect(readKey(key, test, "mcp", NOW + 1)).toBeNull();
  });

  test("a key signed with another secret, or edited, is refused", () => {
    const other = testSigningKey("b".repeat(32));
    const token = mintTestKey(other, { sub: SUB, ver: 1, sv: 1 }, NOW);
    expect(readTestKey(key, token, NOW + 1)).toBeNull();
    const real = mintTestKey(key, { sub: SUB, ver: 1, sv: 1 }, NOW);
    const [h, p, s] = real.split(".");
    const forged = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(p ?? "", "base64url").toString()),
        ver: 9,
      }),
    ).toString("base64url");
    expect(readTestKey(key, `${h}.${forged}.${s}`, NOW + 1)).toBeNull();
  });
});
