import { describe, expect, test } from "bun:test";
import { mintKey, readKey, signingKey } from "./key";

const KEY = signingKey("test-secret-at-least-32-characters-long");
const OTHER = signingKey("another-secret-at-least-32-characters");
const NOW = 1_800_000_000;
const SUBJECT = {
  sub: "11111111-1111-4111-8111-111111111111",
  cid: "44444444-4444-4444-8444-444444444444",
  ver: 3,
  con: "55555555-5555-4555-8555-555555555555",
};

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("MCP keys", () => {
  test("a key reads back as it was made, for its audience", () => {
    const token = mintKey(KEY, SUBJECT, "mcp", NOW, 60);
    expect(readKey(KEY, token, "mcp", NOW)).toMatchObject({
      ...SUBJECT,
      aud: "mcp",
      exp: NOW + 60,
    });
  });

  test("a refresh key never opens the endpoint, nor an access key the refresh", () => {
    expect(
      readKey(KEY, mintKey(KEY, SUBJECT, "mcp_refresh", NOW, 60), "mcp", NOW),
    ).toBeNull();
    expect(
      readKey(KEY, mintKey(KEY, SUBJECT, "mcp", NOW, 60), "mcp_refresh", NOW),
    ).toBeNull();
  });

  test("an expired key is refused", () => {
    expect(
      readKey(KEY, mintKey(KEY, SUBJECT, "mcp", NOW, 60), "mcp", NOW + 60),
    ).toBeNull();
  });

  test("a key another instance signed is refused", () => {
    expect(readKey(KEY, mintKey(OTHER, SUBJECT, "mcp", NOW, 60), "mcp", NOW)).toBeNull();
  });

  test("a changed payload is refused", () => {
    const [header, , signature] = mintKey(KEY, SUBJECT, "mcp", NOW, 60).split(".");
    // Every claim a real key carries, so only the signature can refuse it.
    const forged = b64({
      ...SUBJECT,
      ver: 4,
      aud: "mcp",
      iat: NOW,
      exp: NOW + 60,
      jti: "forged",
    });
    expect(readKey(KEY, `${header}.${forged}.${signature}`, "mcp", NOW)).toBeNull();
  });

  test("a token that names its own algorithm is refused", () => {
    const claims = b64({ ...SUBJECT, aud: "mcp", iat: NOW, exp: NOW + 60 });
    expect(
      readKey(KEY, `${b64({ alg: "none", typ: "JWT" })}.${claims}.`, "mcp", NOW),
    ).toBeNull();
    expect(
      readKey(KEY, `${b64({ alg: "none", typ: "JWT" })}.${claims}`, "mcp", NOW),
    ).toBeNull();
  });

  test("two keys made in the same second for the same person differ", () => {
    expect(mintKey(KEY, SUBJECT, "mcp_refresh", NOW, 60)).not.toBe(
      mintKey(KEY, SUBJECT, "mcp_refresh", NOW, 60),
    );
  });

  test("anything that is not a key is refused", () => {
    for (const token of ["", "abc", "a.b.c", "a.b.c.d"]) {
      expect(readKey(KEY, token, "mcp", NOW)).toBeNull();
    }
  });
});
