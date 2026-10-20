/**
 * The test endpoint's door: it answers 404 to everything but a request with the secret address,
 * and says nothing else, so a caller without it cannot tell the endpoint exists. A caller with the
 * address but no valid key is told to sign in, and where.
 */
import { describe, expect, test } from "bun:test";
import { handleTestRequest, isSecretPath, notFound } from "./endpoint";

const SECRET = "s".repeat(40);
const META = `https://example.test/.well-known/oauth-protected-resource/api/t/${SECRET}`;
const SUB = "11111111-1111-4111-8111-111111111111";

/** A door over fakes that count what happens behind it. */
function door(
  options: {
    secretPath?: string | undefined;
    valid?: string | null;
    limit?: (key: string, max: number, windowMs: number) => Promise<boolean>;
  } = {},
) {
  const calls = {
    holderOf: 0,
    served: 0,
    limited: [] as Array<[string, number, number]>,
  };
  const deps = {
    secretPath: "secretPath" in options ? options.secretPath : SECRET,
    resourceMetadataUrl: META,
    holderOf: async (token: string) => {
      calls.holderOf += 1;
      return token === (options.valid ?? "good") ? { userId: SUB } : null;
    },
    serve: async (_request: Request) => {
      calls.served += 1;
      return new Response("ok");
    },
    limit: async (key: string, max: number, windowMs: number) => {
      calls.limited.push([key, max, windowMs]);
      return options.limit ? options.limit(key, max, windowMs) : true;
    },
  };
  return { deps, calls };
}

const request = (headers: Record<string, string> = {}) =>
  new Request("https://example.test/api/t/x", { method: "POST", headers });
const good = { authorization: "Bearer good" };

/** What a caller can see of an answer, to compare two answers byte for byte. */
const shape = async (res: Response) => ({
  status: res.status,
  body: await res.text(),
  headers: [...res.headers].sort(([a], [b]) => a.localeCompare(b)),
});

describe("the door", () => {
  test("serves a request with the secret address and a valid key", async () => {
    const { deps } = door();
    const res = await handleTestRequest(request(good), SECRET, deps);
    expect(await res.text()).toBe("ok");
  });

  test("answers one byte-identical 404 to a wrong or unset address and to a browser, and serves nothing", async () => {
    const { deps, calls } = door();
    const { deps: off } = door({ secretPath: undefined });
    const before = calls.served;
    const refusals = await Promise.all([
      handleTestRequest(request(good), "wrong", deps),
      handleTestRequest(request(), "wrong", deps),
      handleTestRequest(request(good), SECRET, off),
      handleTestRequest(request(), SECRET, off),
      handleTestRequest(
        request({ ...good, origin: "https://evil.example" }),
        SECRET,
        deps,
      ),
    ]);
    const expected = await shape(notFound());
    for (const res of refusals) expect(await shape(res)).toEqual(expected);
    expect(expected.status).toBe(404);
    expect(expected.headers.map(([name]) => name)).not.toContain("www-authenticate");
    expect(calls.served).toBe(before);
  });

  test("tells a caller with the address and no valid key to sign in, and where", async () => {
    const { deps, calls } = door();
    const none = await handleTestRequest(request(), SECRET, deps);
    const bad = await handleTestRequest(
      request({ authorization: "Bearer bad" }),
      SECRET,
      deps,
    );
    expect(none.status).toBe(401);
    expect(none.headers.get("www-authenticate")).toBe(
      `Bearer resource_metadata="${META}"`,
    );
    expect(bad.status).toBe(401);
    expect(bad.headers.get("www-authenticate")).toBe(
      `Bearer error="invalid_token", resource_metadata="${META}"`,
    );
    expect(await none.json()).toEqual({ error: "unauthorized" });
    expect(none.headers.get("cache-control")).toBe("no-store");
    expect(calls.served).toBe(0);
  });

  test("refuses a batch of calls and an oversized body, and hands a single call on whole", async () => {
    const post = (body: string) =>
      new Request("https://example.test/api/t/x", {
        method: "POST",
        headers: good,
        body,
      });
    const seen: string[] = [];
    const { deps } = door();
    const reading = {
      ...deps,
      serve: async (r: Request) => {
        seen.push(await r.text());
        return new Response("ok");
      },
    };
    const batch = await handleTestRequest(post('[{"id":1},{"id":2}]'), SECRET, reading);
    const big = await handleTestRequest(post("x".repeat(64_001)), SECRET, reading);
    const single = await handleTestRequest(post('{"id":1}'), SECRET, reading);
    expect([batch.status, big.status, single.status]).toEqual([400, 413, 200]);
    expect(seen).toEqual(['{"id":1}']);
  });

  test("an address of another length or an unset secret never matches", () => {
    expect(isSecretPath(SECRET, SECRET)).toBe(true);
    expect(isSecretPath(SECRET, `${SECRET}x`)).toBe(false);
    expect(isSecretPath(SECRET, "")).toBe(false);
    expect(isSecretPath(undefined, "")).toBe(false);
  });
});

describe("the door's own limits", () => {
  test("count a request per client address before any key check, and per person after it", async () => {
    const { deps, calls } = door();
    await handleTestRequest(
      request({ ...good, "x-real-ip": "203.0.113.9" }),
      SECRET,
      deps,
    );
    expect(calls.limited).toEqual([
      ["test-mcp-door-ip:203.0.113.9", 60, 60_000],
      [`test-mcp-door:${SUB}`, 120, 60_000],
    ]);
    expect(calls.served).toBe(1);
  });

  test("a client over its address budget gets the same 404, and no key is looked at", async () => {
    const { deps, calls } = door({
      limit: async (key) => !key.startsWith("test-mcp-door-ip:"),
    });
    const res = await handleTestRequest(request(good), SECRET, deps);
    expect(await shape(res)).toEqual(await shape(notFound()));
    expect(calls.holderOf).toBe(0);
    expect(calls.served).toBe(0);
  });

  test("a person over their budget is told so, with when to come back", async () => {
    const { deps, calls } = door({
      limit: async (key) => !key.startsWith("test-mcp-door:"),
    });
    const res = await handleTestRequest(request(good), SECRET, deps);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    expect(await res.json()).toEqual({ error: "Too many requests." });
    expect(calls.holderOf).toBe(1);
    expect(calls.served).toBe(0);
  });

  test("a limiter that fails counts as a spent budget, whichever way it fails", async () => {
    const rejecting = door({
      limit: async () => {
        throw new Error("database down");
      },
    });
    const byAddress = await handleTestRequest(request(good), SECRET, rejecting.deps);
    expect(await shape(byAddress)).toEqual(await shape(notFound()));
    expect(rejecting.calls.holderOf).toBe(0);

    const throwing = door({
      limit: () => {
        throw new Error("synchronous failure");
      },
    });
    const bySyncThrow = await handleTestRequest(request(good), SECRET, throwing.deps);
    expect(await shape(bySyncThrow)).toEqual(await shape(notFound()));

    const failsForPerson = door({
      limit: async (key) => {
        if (key.startsWith("test-mcp-door:")) throw new Error("database down");
        return true;
      },
    });
    const byPerson = await handleTestRequest(request(good), SECRET, failsForPerson.deps);
    expect(byPerson.status).toBe(429);
    expect(failsForPerson.calls.served).toBe(0);
  });

  test("are not consulted for a wrong address, an unset secret or a browser request", async () => {
    const { deps, calls } = door();
    const { deps: off, calls: offCalls } = door({ secretPath: undefined });
    await handleTestRequest(request(good), "wrong", deps);
    await handleTestRequest(
      request({ ...good, origin: "https://evil.example" }),
      SECRET,
      deps,
    );
    await handleTestRequest(request(good), SECRET, off);
    expect(calls.limited).toEqual([]);
    expect(offCalls.limited).toEqual([]);
  });
});
