/**
 * The test endpoint's browser sign-in: a request that names the endpoint's secret address is for
 * it and nothing else, its code and keys open only it, and every grant ends the moment the
 * operator signs out, ends their assistants, or stops being an operator.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mintKey, readKey, signingKey } from "@/lib/mcp/key";
import {
  allow,
  authorize,
  exchange,
  readRequest,
  registerClient,
  spendOn,
  type TokenDeps,
} from "@/lib/mcp/oauth";
import { holderRefusal, type PersonRow } from "./holder";
import { readTestKey, testSigningKey } from "./key";
import { allowTest, TEST_ACCESS_SECONDS, TEST_GRANT_SECONDS, testGrants } from "./oauth";

const INSTANCE = signingKey("test-secret-at-least-32-characters-long");
const TEST = testSigningKey("test-secret-at-least-32-characters-long");
const NOW = 1_800_000_000;
const DAY = 24 * 60 * 60;
const ISSUER = "https://isms.example.com";
const RESOURCE = `${ISSUER}/api/mcp`;
const SECRET_PATH = "s3cretPathWithManyDifferentCharacters_0123456789";
const TEST_RESOURCE = `${ISSUER}/api/t/${SECRET_PATH}`;
const OPERATOR_EMAIL = "ops@example.com";
const OPERATOR = { sub: "11111111-1111-4111-8111-111111111111", ver: 2, sv: 5 };
const CUSTOMER = { ...OPERATOR, cid: "44444444-4444-4444-8444-444444444444" };
const VERIFIER = "a-verifier-of-at-least-forty-three-characters-0123456789";
const CHALLENGE = createHash("sha256").update(VERIFIER).digest("base64url");
const REDIRECT = "http://localhost:4123/callback";

function register(name = "Claude Code"): string {
  const registered = registerClient(
    INSTANCE,
    { redirect_uris: [REDIRECT], client_name: name },
    NOW,
  );
  if (!registered.ok) throw new Error(registered.description);
  return String(registered.client.client_id);
}

const authorizeParams = (clientId: string, resource?: string) =>
  new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT,
    code_challenge: CHALLENGE,
    code_challenge_method: "S256",
    state: "xyz",
    ...(resource === undefined ? {} : { resource }),
  });

/** What the consent page receives for a client asking for `resource`. */
function requestFor(clientId: string, resource?: string) {
  const outcome = authorize(
    INSTANCE,
    authorizeParams(clientId, resource),
    RESOURCE,
    NOW,
    TEST_RESOURCE,
  );
  if (outcome.kind !== "consent") throw new Error(outcome.message);
  const request = readRequest(INSTANCE, outcome.request, NOW);
  if (!request) throw new Error("no request");
  return request;
}

const codeIn = (back: string): string =>
  new URL(back).searchParams.get("code") ?? "no code";

/** The code the operator's Allow hands out for the test endpoint. */
const testCodeFor = (clientId: string, holder = OPERATOR): string =>
  codeIn(allowTest(INSTANCE, requestFor(clientId, TEST_RESOURCE), holder, ISSUER, NOW));

/** The customer's own code, the way its consent page hands it out. */
const customerCodeFor = (clientId: string): string =>
  codeIn(allow(INSTANCE, requestFor(clientId, RESOURCE), CUSTOMER, ISSUER, NOW));

/** The rate limiter as Postgres keeps it: one fixed window per key, on a clock the test moves. */
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

/** The person's row as the database holds it today, for the test to change. */
function world(clock = { now: NOW }) {
  const row: PersonRow = {
    email: OPERATOR_EMAIL,
    emailVerifiedAt: new Date(NOW * 1000),
    mcpKeyVersion: OPERATOR.ver,
    sessionVersion: OPERATOR.sv,
  };
  const state = { row: row as PersonRow | undefined, revoked: [] as string[] };
  const spend = spendOn(fakeCounter(clock));
  const grants = testGrants(
    { instance: INSTANCE, test: TEST },
    {
      person: async () => state.row,
      isOperator: (email) => email === OPERATOR_EMAIL,
      spend,
      revoke: async (userId) => {
        state.revoked.push(userId);
      },
    },
  );
  const customerDeps: TokenDeps = {
    versionOf: async () => CUSTOMER.ver,
    spend,
    revoke: async () => {},
    connect: async () => "55555555-5555-4555-8555-555555555555",
    isOpen: async () => true,
  };
  return { state, grants, customerDeps };
}

const redeemForm = (clientId: string, code: string, extra: Record<string, string> = {}) =>
  new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    code_verifier: VERIFIER,
    redirect_uri: REDIRECT,
    ...extra,
  });

const refreshForm = (clientId: string, token: unknown) =>
  new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: String(token),
  });

async function signedIn(w: ReturnType<typeof world>, clientId: string, now = NOW) {
  const outcome = await exchange(
    INSTANCE,
    redeemForm(clientId, testCodeFor(clientId)),
    w.customerDeps,
    now,
    w.grants,
  );
  if (!outcome.ok) throw new Error(outcome.description);
  return outcome.body;
}

describe("which endpoint a sign-in is for", () => {
  test("a request naming the secret address is for the test endpoint; the customer's address, or none, for the customer's", () => {
    const clientId = register();
    expect(requestFor(clientId, TEST_RESOURCE).res).toBe("test");
    expect(requestFor(clientId, RESOURCE).res).toBe("mcp");
    expect(requestFor(clientId).res).toBe("mcp");
  });

  test("any other address is refused, and the refusal never names the secret one", () => {
    const outcome = authorize(
      INSTANCE,
      authorizeParams(register(), `${TEST_RESOURCE}x`),
      RESOURCE,
      NOW,
      TEST_RESOURCE,
    );
    expect(outcome.kind).toBe("refuse");
    if (outcome.kind === "refuse") {
      expect(outcome.message).toContain(RESOURCE);
      expect(outcome.message).not.toContain(SECRET_PATH);
    }
  });

  test("an instance with no secret address knows no test endpoint: its address is refused like any", () => {
    const outcome = authorize(
      INSTANCE,
      authorizeParams(register(), TEST_RESOURCE),
      RESOURCE,
      NOW,
    );
    expect(outcome.kind).toBe("refuse");
  });
});

describe("the keys it hands out", () => {
  test("a code buys an hour-long key the door accepts, and a refresh key that is no access key", async () => {
    const clientId = register();
    const body = await signedIn(world(), clientId);
    const access = readTestKey(TEST, String(body.access_token), NOW + 10);
    expect(access).toMatchObject(OPERATOR);
    expect(access?.exp).toBe(NOW + TEST_ACCESS_SECONDS);
    expect(body.expires_in).toBe(TEST_ACCESS_SECONDS);
    expect(readTestKey(TEST, String(body.refresh_token), NOW + 10)).toBeNull();
    expect(
      readKey(INSTANCE, String(body.refresh_token), "mcp_refresh", NOW + 10),
    ).toBeNull();
  });

  test("the keys carry the person and the versions, and nothing of the code they were bought with", async () => {
    const body = await signedIn(world(), register());
    const claimNames = (token: unknown): string[] =>
      Object.keys(
        JSON.parse(
          Buffer.from(String(token).split(".")[1] ?? "", "base64url").toString(),
        ),
      ).sort();
    expect(claimNames(body.access_token)).toEqual([
      "aud",
      "exp",
      "iat",
      "jti",
      "sub",
      "sv",
      "ver",
    ]);
    expect(claimNames(body.refresh_token)).toEqual([
      "aud",
      "azp",
      "exp",
      "grant",
      "iat",
      "jti",
      "sub",
      "sv",
      "ver",
    ]);
  });

  test("a customer's keys do not open the test endpoint, and the test keys open nothing of the customer's", async () => {
    const clientId = register();
    const body = await signedIn(world(), clientId);
    const customer = mintKey(
      INSTANCE,
      { ...CUSTOMER, con: "55555555-5555-4555-8555-555555555555" },
      "mcp",
      NOW,
      3600,
    );
    expect(readTestKey(TEST, customer, NOW + 1)).toBeNull();
    expect(readTestKey(INSTANCE, customer, NOW + 1)).toBeNull();
    for (const key of [INSTANCE, TEST]) {
      expect(readKey(key, String(body.access_token), "mcp", NOW + 1)).toBeNull();
      expect(readKey(key, String(body.refresh_token), "mcp_refresh", NOW + 1)).toBeNull();
    }
  });

  test("the customer's own code and refresh key still go the customer's way through the same endpoint", async () => {
    const w = world();
    const clientId = register();
    const bought = await exchange(
      INSTANCE,
      redeemForm(clientId, customerCodeFor(clientId)),
      w.customerDeps,
      NOW,
      w.grants,
    );
    if (!bought.ok) throw new Error(bought.description);
    expect(
      readKey(INSTANCE, String(bought.body.access_token), "mcp", NOW + 1),
    ).toMatchObject({ sub: CUSTOMER.sub, cid: CUSTOMER.cid });
    const renewed = await exchange(
      INSTANCE,
      refreshForm(clientId, bought.body.refresh_token),
      w.customerDeps,
      NOW + 5,
      w.grants,
    );
    expect(renewed.ok).toBe(true);
  });

  test("a test code is no customer code: without the test grants it buys nothing", async () => {
    const w = world();
    const clientId = register();
    const outcome = await exchange(
      INSTANCE,
      redeemForm(clientId, testCodeFor(clientId)),
      w.customerDeps,
      NOW,
    );
    expect(outcome).toMatchObject({ ok: false, error: "invalid_grant" });
  });
});

describe("the code", () => {
  test("works once, and only for the client, redirect and verifier it was made for", async () => {
    const w = world();
    const clientId = register();
    const other = register("Another");
    const code = testCodeFor(clientId);
    const bad = [
      redeemForm(clientId, code, { code_verifier: `${VERIFIER}x` }),
      redeemForm(other, code),
      redeemForm(clientId, code, { redirect_uri: "http://localhost:9/other" }),
    ];
    for (const form of bad) {
      expect(await exchange(INSTANCE, form, w.customerDeps, NOW, w.grants)).toMatchObject(
        {
          ok: false,
          error: "invalid_grant",
        },
      );
    }
    expect(
      (
        await exchange(
          INSTANCE,
          redeemForm(clientId, code),
          w.customerDeps,
          NOW,
          w.grants,
        )
      ).ok,
    ).toBe(true);
    expect(
      await exchange(INSTANCE, redeemForm(clientId, code), w.customerDeps, NOW, w.grants),
    ).toMatchObject({
      ok: false,
      error: "invalid_grant",
    });
  });

  test("is not redeemed once the code is a minute old", async () => {
    const w = world();
    const clientId = register();
    const code = testCodeFor(clientId);
    expect(
      await exchange(
        INSTANCE,
        redeemForm(clientId, code),
        w.customerDeps,
        NOW + 61,
        w.grants,
      ),
    ).toMatchObject({ ok: false, error: "invalid_grant" });
  });

  test("buys nothing for a person who is no operator, whoever made the request", async () => {
    const w = world();
    const clientId = register();
    const code = testCodeFor(clientId);
    w.state.row = w.state.row && { ...w.state.row, email: "someone@example.com" };
    expect(
      await exchange(INSTANCE, redeemForm(clientId, code), w.customerDeps, NOW, w.grants),
    ).toMatchObject({ ok: false, error: "invalid_grant" });
  });
});

describe("what ends a sign-in", () => {
  /** Each ends the grant at its next refresh: the change, and the row it leaves. */
  const endings: ReadonlyArray<[string, (row: PersonRow) => PersonRow | undefined]> = [
    ["signing out", (row) => ({ ...row, sessionVersion: row.sessionVersion + 1 })],
    [
      "ending all assistants",
      (row) => ({ ...row, mcpKeyVersion: row.mcpKeyVersion + 1 }),
    ],
    ["leaving the operator list", (row) => ({ ...row, email: "former@example.com" })],
    ["an address no longer verified", (row) => ({ ...row, emailVerifiedAt: null })],
    ["deleting the account", () => undefined],
  ];

  for (const [name, change] of endings) {
    test(`${name} ends it at the next refresh, and the key in hand fails the door's own check`, async () => {
      const w = world();
      const clientId = register();
      const body = await signedIn(w, clientId);
      const held = readTestKey(TEST, String(body.access_token), NOW + 1);
      expect(held).not.toBeNull();
      w.state.row = w.state.row && change(w.state.row);
      expect(
        holderRefusal(
          held ?? { ver: 0, sv: 0 },
          w.state.row,
          (email) => email === OPERATOR_EMAIL,
        ),
      ).not.toBeNull();
      const again = await exchange(
        INSTANCE,
        refreshForm(clientId, body.refresh_token),
        w.customerDeps,
        NOW + 5,
        w.grants,
      );
      expect(again).toMatchObject({ ok: false, error: "invalid_grant" });
      // A refresh key that was ended is only refused: replayed later it disconnects nobody.
      expect(w.state.revoked).toEqual([]);
    });
  }

  test("a refresh key used again within a minute still works: a race, not a theft", async () => {
    const clock = { now: NOW };
    const w = world(clock);
    const clientId = register();
    const body = await signedIn(w, clientId);
    clock.now = NOW + 30;
    const twice = await Promise.all(
      [0, 1].map(() =>
        exchange(
          INSTANCE,
          refreshForm(clientId, body.refresh_token),
          w.customerDeps,
          clock.now,
          w.grants,
        ),
      ),
    );
    expect(twice.map((outcome) => outcome.ok)).toEqual([true, true]);
    expect(w.state.revoked).toEqual([]);
  });

  test("a refresh key used again later was copied: refused, and the person's assistants disconnected", async () => {
    const clock = { now: NOW };
    const w = world(clock);
    const clientId = register();
    const body = await signedIn(w, clientId);
    clock.now = NOW + 120;
    const first = await exchange(
      INSTANCE,
      refreshForm(clientId, body.refresh_token),
      w.customerDeps,
      clock.now,
      w.grants,
    );
    expect(first.ok).toBe(true);
    clock.now = NOW + 400;
    const replay = await exchange(
      INSTANCE,
      refreshForm(clientId, body.refresh_token),
      w.customerDeps,
      clock.now,
      w.grants,
    );
    expect(replay).toMatchObject({ ok: false, error: "invalid_grant" });
    expect(w.state.revoked).toEqual([OPERATOR.sub]);
  });

  test("a refresh key works only for the client it was issued to", async () => {
    const w = world();
    const clientId = register();
    const body = await signedIn(w, clientId);
    expect(
      await exchange(
        INSTANCE,
        refreshForm(register("Another"), body.refresh_token),
        w.customerDeps,
        NOW + 5,
        w.grants,
      ),
    ).toMatchObject({ ok: false, error: "invalid_grant" });
  });

  test("the sign-in ends 14 days after the operator allowed it, however often it refreshes", async () => {
    const clock = { now: NOW };
    const w = world(clock);
    const clientId = register();
    const end = NOW + TEST_GRANT_SECONDS;
    expect(TEST_GRANT_SECONDS).toBe(14 * DAY);
    let body = await signedIn(w, clientId);
    for (const day of [4, 8, 12, 13]) {
      clock.now = NOW + day * DAY;
      const next = await exchange(
        INSTANCE,
        refreshForm(clientId, body.refresh_token),
        w.customerDeps,
        clock.now,
        w.grants,
      );
      if (!next.ok) throw new Error(`day ${day}: ${next.description}`);
      body = next.body;
      const access = readTestKey(TEST, String(body.access_token), clock.now);
      expect(access?.exp).toBeLessThanOrEqual(end);
    }
    // Ten minutes before the end the key is cut to what is left of the grant, not a full hour.
    clock.now = end - 600;
    const last = await exchange(
      INSTANCE,
      refreshForm(clientId, body.refresh_token),
      w.customerDeps,
      clock.now,
      w.grants,
    );
    if (!last.ok) throw new Error(last.description);
    body = last.body;
    expect(body.expires_in).toBe(600);
    expect(readTestKey(TEST, String(body.access_token), clock.now)?.exp).toBe(end);
    clock.now = end;
    expect(
      await exchange(
        INSTANCE,
        refreshForm(clientId, body.refresh_token),
        w.customerDeps,
        end,
        w.grants,
      ),
    ).toMatchObject({ ok: false, error: "invalid_grant" });
    expect(w.state.revoked).toEqual([]);
  });
});
