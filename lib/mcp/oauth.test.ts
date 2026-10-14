import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readKey, signingKey } from "./key";
import {
  allow,
  authorize,
  deny,
  exchange,
  readRequest,
  registerClient,
  sameRedirect,
  spendOn,
  type TokenDeps,
} from "./oauth";

const KEY = signingKey("test-secret-at-least-32-characters-long");
const NOW = 1_800_000_000;
const ISSUER = "https://isms.example.com";
const RESOURCE = `${ISSUER}/api/mcp`;
const HOLDER = {
  sub: "11111111-1111-4111-8111-111111111111",
  cid: "44444444-4444-4444-8444-444444444444",
  ver: 2,
};
const VERIFIER = "a-verifier-of-at-least-forty-three-characters-0123456789";
const CHALLENGE = createHash("sha256").update(VERIFIER).digest("base64url");
const REDIRECT = "http://localhost:4123/callback";

function register(redirectUris: string[] = [REDIRECT], name = "Claude Code"): string {
  const registered = registerClient(
    KEY,
    { redirect_uris: redirectUris, client_name: name },
    NOW,
  );
  if (!registered.ok) throw new Error(registered.description);
  const clientId = registered.client.client_id;
  if (typeof clientId !== "string") throw new Error("no client id");
  return clientId;
}

const params = (values: Record<string, string>) => new URLSearchParams(values);

const authorizeParams = (clientId: string, extra: Record<string, string> = {}) =>
  params({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT,
    code_challenge: CHALLENGE,
    code_challenge_method: "S256",
    state: "xyz",
    resource: RESOURCE,
    ...extra,
  });

/** A code for the holder, the way the consent page hands it out. */
function codeFor(clientId: string): string {
  const outcome = authorize(KEY, authorizeParams(clientId), RESOURCE, NOW);
  if (outcome.kind !== "consent") throw new Error(outcome.kind);
  const request = readRequest(KEY, outcome.request, NOW);
  if (!request) throw new Error("no request");
  const back = new URL(allow(KEY, request, HOLDER, ISSUER, NOW));
  expect(back.searchParams.get("state")).toBe("xyz");
  expect(back.searchParams.get("iss")).toBe(ISSUER);
  return back.searchParams.get("code") ?? "";
}

const refreshWith = (clientId: string, token: unknown) =>
  params({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: String(token),
  });

/**
 * The rate limiter as Postgres keeps it: one fixed window per key, opened by its first hit, on a
 * clock in seconds the test moves.
 */
function fakeCounter(clock: { now: number }) {
  const windows = new Map<string, { resetAt: number; count: number }>();
  return async (key: string, limit: number, windowMs: number) => {
    const nowMs = clock.now * 1000;
    const open = windows.get(key);
    if (!open || nowMs >= open.resetAt) {
      windows.set(key, { resetAt: nowMs + windowMs, count: 1 });
      return { allowed: true as const };
    }
    if (open.count < limit) {
      open.count += 1;
      return { allowed: true as const };
    }
    return { allowed: false as const, resetInMs: open.resetAt - nowMs };
  };
}

/** The token store as the route wires it, over the fake counter. */
function deps(
  version = HOLDER.ver,
  clock = { now: NOW },
): TokenDeps & { readonly revoked: string[] } {
  const revoked: string[] = [];
  return {
    revoked,
    versionOf: async () => version,
    spend: spendOn(fakeCounter(clock)),
    revoke: async (userId) => {
      revoked.push(userId);
    },
  };
}

const redeem = (clientId: string, code: string, extra: Record<string, string> = {}) =>
  params({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    code_verifier: VERIFIER,
    redirect_uri: REDIRECT,
    ...extra,
  });

describe("client registration", () => {
  test("https and loopback http are registered; nothing else is", () => {
    expect(
      registerClient(
        KEY,
        { redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] },
        NOW,
      ).ok,
    ).toBe(true);
    expect(
      registerClient(KEY, { redirect_uris: ["http://127.0.0.1:9/cb"] }, NOW).ok,
    ).toBe(true);
    for (const uri of [
      "http://example.com/cb",
      "myapp://cb",
      "https://example.com/cb#frag",
      "not a url",
    ]) {
      expect(registerClient(KEY, { redirect_uris: [uri] }, NOW).ok).toBe(false);
    }
    expect(registerClient(KEY, {}, NOW).ok).toBe(false);
  });

  test("a loopback redirect matches on any port, any other only exactly", () => {
    expect(sameRedirect("http://localhost:1/cb", "http://localhost:4123/cb")).toBe(true);
    expect(sameRedirect("http://localhost:1/cb", "http://localhost:4123/other")).toBe(
      false,
    );
    expect(sameRedirect("https://a.example/cb", "https://a.example:8443/cb")).toBe(false);
  });
});

describe("authorization", () => {
  test("an unknown client or redirect is refused on the page, never sent anywhere", () => {
    expect(authorize(KEY, authorizeParams("forged"), RESOURCE, NOW).kind).toBe("refuse");
    const clientId = register();
    const elsewhere = authorizeParams(clientId, {
      redirect_uri: "https://evil.example/cb",
    });
    expect(authorize(KEY, elsewhere, RESOURCE, NOW).kind).toBe("refuse");
  });

  test("no PKCE, or a token for another resource, is refused on the page, not sent back", () => {
    // Anyone can register any https address, so an error sent there by itself would make
    // this server an open redirector.
    const clientId = register(["https://anyone.example/cb"]);
    for (const extra of [
      { code_challenge_method: "plain" },
      { code_challenge: "short" },
      { resource: "https://other.example/api/mcp" },
      { response_type: "token" },
    ]) {
      const asked = authorizeParams(clientId, {
        redirect_uri: "https://anyone.example/cb",
        ...extra,
      });
      expect(authorize(KEY, asked, RESOURCE, NOW).kind).toBe("refuse");
    }
  });

  test("a waiting request expires after ten minutes", () => {
    const outcome = authorize(KEY, authorizeParams(register()), RESOURCE, NOW);
    if (outcome.kind !== "consent") throw new Error(outcome.kind);
    expect(readRequest(KEY, outcome.request, NOW + 599)?.client).toBe("Claude Code");
    expect(readRequest(KEY, outcome.request, NOW + 600)).toBeNull();
  });

  test("declining sends access_denied back with the state", () => {
    const outcome = authorize(KEY, authorizeParams(register()), RESOURCE, NOW);
    if (outcome.kind !== "consent") throw new Error(outcome.kind);
    const request = readRequest(KEY, outcome.request, NOW);
    if (!request) throw new Error("no request");
    const url = new URL(deny(request, ISSUER));
    expect(url.searchParams.get("error")).toBe("access_denied");
    expect(url.searchParams.get("state")).toBe("xyz");
  });
});

describe("token", () => {
  test("a code and its verifier buy an access key and a refresh key for the holder", async () => {
    const clientId = register();
    const outcome = await exchange(KEY, redeem(clientId, codeFor(clientId)), deps(), NOW);
    if (!outcome.ok) throw new Error(outcome.description);
    const access = readKey(KEY, String(outcome.body.access_token), "mcp", NOW);
    expect(access).toMatchObject({ ...HOLDER, client: "Claude Code", exp: NOW + 3600 });
    expect(readKey(KEY, String(outcome.body.refresh_token), "mcp", NOW)).toBeNull();
  });

  test("a code works once", async () => {
    const clientId = register();
    const code = codeFor(clientId);
    const shared = deps();
    expect((await exchange(KEY, redeem(clientId, code), shared, NOW)).ok).toBe(true);
    expect((await exchange(KEY, redeem(clientId, code), shared, NOW)).ok).toBe(false);
  });

  test("a wrong verifier, another client, another redirect or an old code is refused", async () => {
    const clientId = register();
    const other = register([REDIRECT], "Other");
    const code = codeFor(clientId);
    for (const form of [
      redeem(clientId, code, { code_verifier: `${VERIFIER}x` }),
      redeem(other, code),
      redeem(clientId, code, { redirect_uri: "http://localhost:4123/elsewhere" }),
    ]) {
      expect(await exchange(KEY, form, deps(), NOW)).toMatchObject({
        ok: false,
        error: "invalid_grant",
      });
    }
    expect(await exchange(KEY, redeem(clientId, code), deps(), NOW + 60)).toMatchObject({
      ok: false,
      error: "invalid_grant",
    });
  });

  test("after disconnecting, neither a code nor a refresh key buys access", async () => {
    const clientId = register();
    const first = await exchange(KEY, redeem(clientId, codeFor(clientId)), deps(), NOW);
    if (!first.ok) throw new Error(first.description);
    const refresh = params({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: String(first.body.refresh_token),
    });
    expect((await exchange(KEY, refresh, deps(), NOW + 10)).ok).toBe(true);
    expect((await exchange(KEY, refresh, deps(HOLDER.ver + 1), NOW + 10)).ok).toBe(false);
    expect(
      (
        await exchange(
          KEY,
          redeem(clientId, codeFor(clientId)),
          deps(HOLDER.ver + 1),
          NOW,
        )
      ).ok,
    ).toBe(false);
  });

  test("a refresh key used again within a minute still works: a race, not a theft", async () => {
    const clientId = register();
    const clock = { now: NOW };
    const shared = deps(HOLDER.ver, clock);
    const first = await exchange(KEY, redeem(clientId, codeFor(clientId)), shared, NOW);
    if (!first.ok) throw new Error(first.description);
    const again = refreshWith(clientId, first.body.refresh_token);
    expect((await exchange(KEY, again, shared, NOW)).ok).toBe(true);
    clock.now = NOW + 30;
    expect((await exchange(KEY, again, shared, NOW + 30)).ok).toBe(true);
    expect(shared.revoked).toEqual([]);
  });

  test("a refresh key used again later was copied: refused, and the person's assistants disconnected", async () => {
    const clientId = register();
    const clock = { now: NOW };
    const shared = deps(HOLDER.ver, clock);
    const first = await exchange(KEY, redeem(clientId, codeFor(clientId)), shared, NOW);
    if (!first.ok) throw new Error(first.description);
    const again = refreshWith(clientId, first.body.refresh_token);
    const second = await exchange(KEY, again, shared, NOW);
    if (!second.ok) throw new Error(second.description);
    clock.now = NOW + 61;
    expect(await exchange(KEY, again, shared, NOW + 61)).toMatchObject({
      ok: false,
      error: "invalid_grant",
    });
    expect(shared.revoked).toEqual([HOLDER.sub]);
  });

  test("a copied refresh key replayed after a disconnect is refused and disconnects nothing", async () => {
    const clientId = register();
    const clock = { now: NOW };
    const holder = { ver: HOLDER.ver };
    const shared = { ...deps(HOLDER.ver, clock), versionOf: async () => holder.ver };
    const first = await exchange(KEY, redeem(clientId, codeFor(clientId)), shared, NOW);
    if (!first.ok) throw new Error(first.description);
    const copied = refreshWith(clientId, first.body.refresh_token);
    expect((await exchange(KEY, copied, shared, NOW)).ok).toBe(true);
    holder.ver += 1;
    clock.now = NOW + 61;
    expect(await exchange(KEY, copied, shared, NOW + 61)).toMatchObject({
      ok: false,
      error: "invalid_grant",
    });
    expect(shared.revoked).toEqual([]);
  });

  test("a refresh key works only for the client it was issued to", async () => {
    const clientId = register();
    const first = await exchange(KEY, redeem(clientId, codeFor(clientId)), deps(), NOW);
    if (!first.ok) throw new Error(first.description);
    const refresh = params({
      grant_type: "refresh_token",
      client_id: register([REDIRECT], "Other"),
      refresh_token: String(first.body.refresh_token),
    });
    expect(await exchange(KEY, refresh, deps(), NOW)).toMatchObject({
      ok: false,
      error: "invalid_grant",
    });
  });

  test("an unknown client is invalid_client", async () => {
    expect(
      await exchange(
        KEY,
        params({ grant_type: "refresh_token", client_id: "x" }),
        deps(),
        NOW,
      ),
    ).toMatchObject({
      ok: false,
      status: 401,
      error: "invalid_client",
    });
  });
});

describe("the single-use ledger on the rate limiter's window", () => {
  test("a value presented again reads how long after its first use, at any age", async () => {
    const clock = { now: NOW };
    const spend = spendOn(fakeCounter(clock));
    const lifetime = 30 * 24 * 60 * 60;
    expect(await spend("h", lifetime)).toEqual({ first: true });
    clock.now += 30;
    expect(await spend("h", lifetime)).toEqual({ first: false, sinceS: 30 });
    clock.now += 31;
    expect(await spend("h", lifetime)).toEqual({ first: false, sinceS: 61 });
    clock.now += 20 * 24 * 60 * 60;
    expect(await spend("h", lifetime)).toMatchObject({ first: false });
  });
});
