/**
 * The keys an AI assistant uses for the MCP endpoint, and the other values the sign-in flow hands
 * out (lib/mcp/oauth.ts): JWTs (HS256) signed with a key derived from AUTH_SECRET, so no table
 * holds them and a self-host needs no new secret. Each carries what it is for (`aud`) and when it
 * ends (`exp`), and is accepted only for that.
 *
 * An access key names the person, the company it works in and the person's key version; bumping
 * `user.mcp_key_version` refuses every key made before it.
 *
 * No env and no database: the caller passes the signing key and the time, so the tests run
 * without either (lib/mcp/instance-key.ts derives the live key).
 */
import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** A pasted key lasts 90 days; the sign-in flow issues shorter ones. */
export const PASTED_KEY_SECONDS = 90 * 24 * 60 * 60;

/** The fixed header: verifying compares it whole, so no token can choose its own algorithm. */
const HEADER = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
  "base64url",
);

/** Its own key per purpose, so these and anything else signed with AUTH_SECRET never meet. */
export const signingKey = (secret: string): Buffer =>
  Buffer.from(hkdfSync("sha256", secret, "", "nisd2 mcp key", 32));

const signatureOf = (key: Buffer, data: string): string =>
  createHmac("sha256", key).update(data).digest("base64url");

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

interface Signed {
  readonly aud: string;
  readonly exp: number;
}

export function sign<C extends Signed>(key: Buffer, claims: C): string {
  const signed = `${HEADER}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
  return `${signed}.${signatureOf(key, signed)}`;
}

/**
 * The claims of a token this server signed for `audience` that has not expired, as `schema`
 * reads them; null for anything else.
 */
export function verify<S extends z.ZodType<Signed>>(
  key: Buffer,
  token: string,
  schema: S,
  audience: string,
  nowS: number,
): z.output<S> | null {
  const [header, payload, signature, ...rest] = token.split(".");
  if (header !== HEADER || !payload || !signature || rest.length > 0) return null;
  // Compared as text: decoding first would let a second spelling of the same bytes through.
  const expected = Buffer.from(signatureOf(key, `${header}.${payload}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const claims = schema.safeParse(
    parseJson(Buffer.from(payload, "base64url").toString()),
  );
  if (!claims.success || claims.data.aud !== audience || claims.data.exp <= nowS)
    return null;
  return claims.data;
}

/**
 * What a key is for. An access key opens the endpoint; a refresh key (the sign-in flow's) only
 * buys a new access key, so a long-lived refresh key is never accepted as access.
 */
export const KEY_AUDIENCES = ["mcp", "mcp_refresh"] as const;
export type KeyAudience = (typeof KEY_AUDIENCES)[number];

const KEY_CLAIMS = z.object({
  sub: z.string().uuid(),
  cid: z.string().uuid(),
  ver: z.number().int().positive(),
  aud: z.enum(KEY_AUDIENCES),
  iat: z.number().int(),
  exp: z.number().int(),
  /** The assistant the person allowed in the sign-in flow, by name; absent on a pasted key. */
  client: z.string().max(200).optional(),
  /** The registration it was issued to (a hash of its client id); absent on a pasted key. */
  azp: z.string().max(64).optional(),
  /**
   * Random, so two keys made in the same second for the same person differ: a refresh key is
   * spent by its hash, which must not spend its twin.
   */
  jti: z.string().max(64),
});
export type KeyClaims = z.infer<typeof KEY_CLAIMS>;

/** Who a key is for, as the caller sets it; the rest is stamped by `mintKey`. */
export type KeySubject = Pick<KeyClaims, "sub" | "cid" | "ver" | "client" | "azp">;

export const mintKey = (
  key: Buffer,
  subject: KeySubject,
  audience: KeyAudience,
  nowS: number,
  lifetimeS: number,
): string =>
  sign(key, {
    ...subject,
    aud: audience,
    iat: nowS,
    exp: nowS + lifetimeS,
    jti: randomBytes(12).toString("base64url"),
  });

export const readKey = (
  key: Buffer,
  token: string,
  audience: KeyAudience,
  nowS: number,
): KeyClaims | null => verify(key, token, KEY_CLAIMS, audience, nowS);
