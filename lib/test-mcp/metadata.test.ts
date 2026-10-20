/**
 * The sign-in metadata of the test endpoint: only a caller who names the secret address gets it,
 * and everyone else the endpoint's own 404, byte for byte.
 */
import { describe, expect, test } from "bun:test";
import {
  GET,
  OPTIONS,
  POST,
} from "@/app/.well-known/oauth-protected-resource/api/t/[slug]/route";
import { notFound } from "./endpoint";
import { handleTestMetadata, type TestMetadataDeps } from "./metadata";

const SECRET = "s".repeat(40);

const deps = (overrides: Partial<TestMetadataDeps> = {}): TestMetadataDeps => ({
  secretPath: SECRET,
  limit: async () => true,
  ...overrides,
});

const request = (headers: Record<string, string> = {}) =>
  new Request(
    `https://example.test/.well-known/oauth-protected-resource/api/t/${SECRET}`,
    {
      headers,
    },
  );

const shape = async (res: Response) => ({
  status: res.status,
  body: await res.text(),
  headers: [...res.headers].sort(([a], [b]) => a.localeCompare(b)),
});

describe("the sign-in metadata", () => {
  test("names the resource and the instance's authorization server for the secret address", async () => {
    const res = await handleTestMetadata(request(), SECRET, deps());
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.resource.endsWith(`/api/t/${SECRET}`)).toBe(true);
    expect(body.authorization_servers).toHaveLength(1);
    expect(body.bearer_methods_supported).toEqual(["header"]);
    // Nothing that says what the endpoint is for.
    expect(Object.keys(body).sort()).toEqual([
      "authorization_servers",
      "bearer_methods_supported",
      "resource",
    ]);
  });

  test("answers the one 404 to a wrong address, an unset one and a browser's request", async () => {
    const expected = await shape(notFound());
    const answers = await Promise.all([
      handleTestMetadata(request(), "wrong", deps()),
      handleTestMetadata(request(), SECRET, deps({ secretPath: undefined })),
      handleTestMetadata(request({ origin: "https://evil.example" }), SECRET, deps()),
    ]);
    for (const res of answers) expect(await shape(res)).toEqual(expected);
  });

  test("a client over its address budget, or a limiter that fails, gets the same 404", async () => {
    const expected = await shape(notFound());
    const over = await handleTestMetadata(
      request(),
      SECRET,
      deps({ limit: async () => false }),
    );
    const failing = await handleTestMetadata(
      request(),
      SECRET,
      deps({
        limit: async () => {
          throw new Error("database down");
        },
      }),
    );
    const throwing = await handleTestMetadata(
      request(),
      SECRET,
      deps({
        limit: () => {
          throw new Error("synchronous failure");
        },
      }),
    );
    for (const res of [over, failing, throwing])
      expect(await shape(res)).toEqual(expected);
  });

  test("counts a request per client address, with the shared address budget", async () => {
    const seen: Array<[string, number, number]> = [];
    await handleTestMetadata(
      request({ "x-real-ip": "203.0.113.9" }),
      SECRET,
      deps({
        limit: async (key, max, windowMs) => {
          seen.push([key, max, windowMs]);
          return true;
        },
      }),
    );
    expect(seen).toEqual([["test-mcp-meta-ip:203.0.113.9", 60, 60_000]]);
  });
});

describe("the route", () => {
  test("answers every method but GET with the one 404, and GET without a secret set the same", async () => {
    const expected = await shape(notFound());
    for (const handler of [POST, OPTIONS]) {
      expect(await shape(await handler())).toEqual(expected);
    }
    const res = await GET(request(), { params: Promise.resolve({ slug: SECRET }) });
    expect(await shape(res)).toEqual(expected);
  });
});
