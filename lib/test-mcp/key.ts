/**
 * The key for the test MCP endpoint: a JWT signed with its own key derived from AUTH_SECRET, so it
 * never verifies where an assistant key of the customer endpoint does, nor the other way round. It
 * names the person, their key version (`user.mcp_key_version`) and their sign-in version
 * (`user.session_version`): "disconnect all assistants" ends it, and so does signing out. No
 * refresh: it ends after a few hours and a new one is made.
 *
 * No env and no database: the caller passes the signing key and the time.
 */
import { hkdfSync, randomBytes } from "node:crypto";
import { z } from "zod";
import { sign, verify } from "@/lib/mcp/key";

export const TEST_KEY_SECONDS = 4 * 60 * 60;

const AUDIENCE = "mcp_test";

export const testSigningKey = (secret: string): Buffer =>
  Buffer.from(hkdfSync("sha256", secret, "", "nisd2 test mcp key", 32));

const CLAIMS = z.object({
  sub: z.uuid(),
  ver: z.number().int().positive(),
  /** The person's sign-in version when the key was made; signing out raises it. */
  sv: z.number().int().positive(),
  aud: z.literal(AUDIENCE),
  iat: z.number().int(),
  exp: z.number().int(),
  jti: z.string().max(64),
});
export type TestKeyClaims = z.infer<typeof CLAIMS>;

export const mintTestKey = (
  key: Buffer,
  subject: Pick<TestKeyClaims, "sub" | "ver" | "sv">,
  nowS: number,
): string =>
  sign(key, {
    ...subject,
    aud: AUDIENCE,
    iat: nowS,
    exp: nowS + TEST_KEY_SECONDS,
    jti: randomBytes(12).toString("base64url"),
  });

/** The claims of a test key this instance signed that has not expired; null for anything else. */
export const readTestKey = (
  key: Buffer,
  token: string,
  nowS: number,
): TestKeyClaims | null => verify(key, token, CLAIMS, AUDIENCE, nowS);
