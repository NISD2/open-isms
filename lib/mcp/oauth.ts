/**
 * The instance as its own OAuth 2.1 authorization server for MCP clients, so an assistant like
 * Claude or Copilot signs in through the browser, on nisd2.eu and on every self-host alike, with
 * no third party. No table of its own: a client's registration, the request waiting on the consent
 * page and the authorization code are signed values (./key), a spent code is remembered in the rate
 * limiter's window (app/api/oauth/token/route.ts), and the tokens are the same keys a person can
 * paste, only shorter-lived. Revoking stays one version bump.
 *
 * Pure: the signing key, the time and the two lookups that need a database come in as arguments.
 */
import { createHash } from "node:crypto";
import { z } from "zod";
import { type KeySubject, mintKey, readKey, sign, verify } from "./key";

const CLIENT_SECONDS = 5 * 365 * 24 * 60 * 60;
const REQUEST_SECONDS = 10 * 60;
const CODE_SECONDS = 60;
export const ACCESS_SECONDS = 60 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;

export const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("base64url");

const parseUrl = (raw: string): URL | null => {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
};

const LOOPBACK: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

const isLoopback = (url: URL): boolean =>
  url.protocol === "http:" && LOOPBACK.has(url.hostname);

/** A redirect a client may register: https anywhere, plain http only back to this machine. */
function redirectUriAllowed(raw: string): boolean {
  const url = parseUrl(raw);
  return (
    url !== null && url.hash === "" && (url.protocol === "https:" || isLoopback(url))
  );
}

/**
 * Whether a redirect is one the client registered: the same address, or for a loopback address
 * any port, since a local client listens wherever the system lets it (RFC 8252, 7.3).
 */
export function sameRedirect(registered: string, given: string): boolean {
  if (registered === given) return true;
  const a = parseUrl(registered);
  const b = parseUrl(given);
  return (
    a !== null &&
    b !== null &&
    isLoopback(a) &&
    isLoopback(b) &&
    a.hostname === b.hostname &&
    a.pathname === b.pathname &&
    a.search === b.search
  );
}

/** The address with these parameters added; unset ones are left out. */
export function withParams(
  uri: string,
  params: Record<string, string | undefined>,
): string {
  const url = new URL(uri);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(name, value);
  }
  return url.toString();
}

// --- Registration (RFC 7591) -----------------------------------------------------------------

const REGISTRATION = z.object({
  redirect_uris: z.array(z.string().max(512)).min(1).max(5),
  client_name: z.string().trim().min(1).max(100).optional(),
});

const CLIENT = z.object({
  aud: z.literal("mcp_client"),
  exp: z.number().int(),
  name: z.string().optional(),
  redirectUris: z.array(z.string()),
});

export type Registration =
  | { readonly ok: true; readonly client: Record<string, unknown> }
  | { readonly ok: false; readonly error: string; readonly description: string };

/** A client's registration: its client id is the signed registration itself, kept nowhere. */
export function registerClient(key: Buffer, body: unknown, nowS: number): Registration {
  const parsed = REGISTRATION.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_client_metadata",
      description: z.prettifyError(parsed.error),
    };
  }
  const { redirect_uris: redirectUris, client_name: name } = parsed.data;
  const refused = redirectUris.find((uri) => !redirectUriAllowed(uri));
  if (refused !== undefined) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      description: `${refused}: use https, or http on localhost.`,
    };
  }
  const clientId = sign(key, {
    aud: "mcp_client",
    exp: nowS + CLIENT_SECONDS,
    name,
    redirectUris,
  });
  return {
    ok: true,
    client: {
      client_id: clientId,
      client_id_issued_at: nowS,
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
  };
}

const readClient = (key: Buffer, clientId: string, nowS: number) =>
  verify(key, clientId, CLIENT, "mcp_client", nowS);

// --- Authorization ----------------------------------------------------------------------------

/** An S256 challenge: the base64url SHA-256 of the verifier, 43 characters (RFC 7636). */
const S256_CHALLENGE = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

const REQUEST = z.object({
  aud: z.literal("mcp_request"),
  exp: z.number().int(),
  /** The client's name as it registered, for the consent page; absent when it gave none. */
  client: z.string().optional(),
  /** Which registration asked: the hash of its client id. */
  azp: z.string(),
  redirectUri: z.string(),
  challenge: z.string(),
  state: z.string().optional(),
});
export type ConsentRequest = z.infer<typeof REQUEST>;

/**
 * Checked: the person decides on the consent page, which receives the signed request. Or refused,
 * shown as a page and sent nowhere: anyone can register a client with any https address, so an
 * error sent back on its own would make this server an open redirector (RFC 9700, on the authorization server as open redirector). The
 * browser goes back to a client only on the person's own Allow or Decline.
 */
export type Authorization =
  | { readonly kind: "consent"; readonly request: string }
  | { readonly kind: "refuse"; readonly message: string };

/**
 * The authorization request (`/authorize`), checked before anyone is asked to consent.
 * `resource` is this server's MCP endpoint, the only one it issues tokens for.
 */
export function authorize(
  key: Buffer,
  params: URLSearchParams,
  resource: string,
  nowS: number,
): Authorization {
  const refuse = (message: string): Authorization => ({ kind: "refuse", message });
  const clientId = params.get("client_id") ?? "";
  const client = readClient(key, clientId, nowS);
  if (!client) {
    return refuse(
      "This assistant is not registered here. Connect it again from the assistant.",
    );
  }
  const [only] = client.redirectUris;
  const redirectUri =
    params.get("redirect_uri") ?? (client.redirectUris.length === 1 ? only : undefined);
  if (!redirectUri || !client.redirectUris.some((r) => sameRedirect(r, redirectUri))) {
    return refuse(
      "The address this sign-in returns to is not one the assistant registered.",
    );
  }
  const state = params.get("state") ?? undefined;
  if (params.get("response_type") !== "code") {
    return refuse("Only response_type=code is supported.");
  }
  const challenge = params.get("code_challenge") ?? "";
  if (
    params.get("code_challenge_method") !== "S256" ||
    !S256_CHALLENGE.safeParse(challenge).success
  ) {
    return refuse("PKCE with S256 is required.");
  }
  const asked = params.get("resource");
  if (asked !== null && asked !== resource) {
    return refuse(`This server issues tokens for ${resource} only.`);
  }
  if (state !== undefined && state.length > 512) {
    return refuse("state is too long.");
  }
  const request: ConsentRequest = {
    aud: "mcp_request",
    exp: nowS + REQUEST_SECONDS,
    client: client.name,
    azp: sha256(clientId),
    redirectUri,
    challenge,
    state,
  };
  return { kind: "consent", request: sign(key, request) };
}

export const readRequest = (
  key: Buffer,
  token: string,
  nowS: number,
): ConsentRequest | null => verify(key, token, REQUEST, "mcp_request", nowS);

const CODE = z.object({
  aud: z.literal("mcp_code"),
  exp: z.number().int(),
  sub: z.string().uuid(),
  cid: z.string().uuid(),
  ver: z.number().int().positive(),
  client: z.string().optional(),
  azp: z.string(),
  redirectUri: z.string(),
  challenge: z.string(),
});

/** The person allowed it: back to the client with a code for this person, company and version. */
export function allow(
  key: Buffer,
  request: ConsentRequest,
  holder: Pick<KeySubject, "sub" | "cid" | "ver">,
  issuer: string,
  nowS: number,
): string {
  const code = sign(key, {
    aud: "mcp_code",
    exp: nowS + CODE_SECONDS,
    ...holder,
    client: request.client,
    azp: request.azp,
    redirectUri: request.redirectUri,
    challenge: request.challenge,
  });
  return withParams(request.redirectUri, { code, state: request.state, iss: issuer });
}

/** The person declined: back to the client with `access_denied`. */
export const deny = (request: ConsentRequest, issuer: string): string =>
  withParams(request.redirectUri, {
    error: "access_denied",
    state: request.state,
    iss: issuer,
  });

// --- Token ------------------------------------------------------------------------------------

/** A code or refresh token presented: the first time, or again some seconds after the first. */
export type Spent =
  | { readonly first: true }
  | { readonly first: false; readonly sinceS: number };

export interface TokenDeps {
  /** The person's current key version; null when the account is gone. */
  readonly versionOf: (userId: string) => Promise<number | null>;
  /** Records a code or refresh token as presented; `lifetimeS` is the whole life of its kind. */
  readonly spend: (hash: string, lifetimeS: number) => Promise<Spent>;
  /** Ends every key and assistant sign-in of the person (a version bump). */
  readonly revoke: (userId: string) => Promise<void>;
}

/** A counter that allows `limit` hits per window of `windowMs`, opened by the first hit. */
type CountHit = (
  key: string,
  limit: number,
  windowMs: number,
) => Promise<
  { readonly allowed: true } | { readonly allowed: false; readonly resetInMs: number }
>;

/** Kept a minute past a value's own life, so a clock edge cannot make it good twice. */
const LEDGER_MARGIN_S = 60;

/**
 * `spend` on a counter with one hit per window: the rate limiter's (lib/rate-limit.ts), which is
 * atomic across replicas and throws rather than failing open. The window opens at the first use
 * and has one fixed length per kind, longer than any such value lives, so the time a refused hit
 * says is left in it tells how long ago that first use was.
 */
export const spendOn =
  (countHit: CountHit) =>
  async (hash: string, lifetimeS: number): Promise<Spent> => {
    const windowMs = (lifetimeS + LEDGER_MARGIN_S) * 1000;
    const verdict = await countHit(`mcp-used:${hash}`, 1, windowMs);
    return verdict.allowed
      ? { first: true }
      : { first: false, sinceS: Math.max(0, (windowMs - verdict.resetInMs) / 1000) };
  };

/**
 * How long after its first use a refresh token still works: a client that refreshes twice at
 * once, or whose answer was lost on the way, would otherwise be locked out. Used later than that,
 * the token was copied, and every assistant of the person is disconnected (RFC 9700, refresh
 * token protection).
 */
const REFRESH_GRACE_S = 60;

export type TokenOutcome =
  | { readonly ok: true; readonly body: Record<string, unknown> }
  | {
      readonly ok: false;
      readonly status: 400 | 401;
      readonly error: string;
      readonly description: string;
    };

const invalidGrant = (description: string): TokenOutcome => ({
  ok: false,
  status: 400,
  error: "invalid_grant",
  description,
});

function tokens(key: Buffer, subject: KeySubject, nowS: number): TokenOutcome {
  return {
    ok: true,
    body: {
      access_token: mintKey(key, subject, "mcp", nowS, ACCESS_SECONDS),
      token_type: "Bearer",
      expires_in: ACCESS_SECONDS,
      refresh_token: mintKey(key, subject, "mcp_refresh", nowS, REFRESH_SECONDS),
    },
  };
}

async function redeem(
  key: Buffer,
  form: URLSearchParams,
  azp: string,
  deps: TokenDeps,
  nowS: number,
): Promise<TokenOutcome> {
  const raw = form.get("code") ?? "";
  const code = verify(key, raw, CODE, "mcp_code", nowS);
  const redirectUri = form.get("redirect_uri");
  if (
    !code ||
    code.azp !== azp ||
    (redirectUri !== null && redirectUri !== code.redirectUri) ||
    sha256(form.get("code_verifier") ?? "") !== code.challenge
  ) {
    return invalidGrant("The code is not valid for this request.");
  }
  if (!(await deps.spend(sha256(raw), CODE_SECONDS)).first) {
    return invalidGrant("The code was used already.");
  }
  if ((await deps.versionOf(code.sub)) !== code.ver) {
    return invalidGrant("The assistants of this account were disconnected.");
  }
  const { sub, cid, ver, client } = code;
  return tokens(key, { sub, cid, ver, client, azp }, nowS);
}

/**
 * A refresh token for a new pair, the old one spent: rotation, which OAuth 2.1 asks of a public
 * client's refresh tokens. A copy used after the grace is the theft rotation exists to notice.
 */
async function refresh(
  key: Buffer,
  form: URLSearchParams,
  azp: string,
  deps: TokenDeps,
  nowS: number,
): Promise<TokenOutcome> {
  const raw = form.get("refresh_token") ?? "";
  const claims = readKey(key, raw, "mcp_refresh", nowS);
  if (!claims || claims.azp !== azp) {
    return invalidGrant("The refresh token is not valid.");
  }
  const spent = await deps.spend(sha256(raw), REFRESH_SECONDS);
  if (!spent.first && spent.sinceS > REFRESH_GRACE_S) {
    await deps.revoke(claims.sub);
    return invalidGrant(
      "This refresh token was used before, so every assistant of this account was disconnected. Connect again.",
    );
  }
  if ((await deps.versionOf(claims.sub)) !== claims.ver) {
    return invalidGrant("The assistants of this account were disconnected.");
  }
  const { sub, cid, ver, client } = claims;
  return tokens(key, { sub, cid, ver, client, azp }, nowS);
}

/** The token request (`/token`): a code or a refresh token for an access key. */
export async function exchange(
  key: Buffer,
  form: URLSearchParams,
  deps: TokenDeps,
  nowS: number,
): Promise<TokenOutcome> {
  const clientId = form.get("client_id") ?? "";
  if (!readClient(key, clientId, nowS)) {
    return {
      ok: false,
      status: 401,
      error: "invalid_client",
      description: "Register the assistant again.",
    };
  }
  const azp = sha256(clientId);
  switch (form.get("grant_type")) {
    case "authorization_code":
      return redeem(key, form, azp, deps, nowS);
    case "refresh_token":
      return refresh(key, form, azp, deps, nowS);
    default:
      return {
        ok: false,
        status: 400,
        error: "unsupported_grant_type",
        description: "Use authorization_code or refresh_token.",
      };
  }
}
