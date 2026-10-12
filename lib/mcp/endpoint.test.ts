import { describe, expect, test } from "bun:test";
import { bearerToken, type EndpointDeps, handleMcpRequest } from "./endpoint";

const METADATA = "https://isms.example.com/.well-known/oauth-protected-resource/api/mcp";

const deps: EndpointDeps<{ readonly userId: string }> = {
  allowedOrigins: ["isms.example.com", "localhost"],
  holderOf: async (token) => (token === "good" ? { userId: "u1" } : null),
  serve: async (_request, holder) => Response.json({ servedFor: holder.userId }),
  resourceMetadataUrl: METADATA,
};

const call = (headers: Record<string, string>) =>
  handleMcpRequest(
    new Request("https://isms.example.com/api/mcp", {
      method: "POST",
      headers,
      body: "{}",
    }),
    deps,
  );

describe("MCP endpoint", () => {
  test("without a key: 401 that points the client at the sign-in", async () => {
    const response = await call({});
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe(
      `Bearer resource_metadata="${METADATA}"`,
    );
  });

  test("with a key it does not honour: 401 invalid_token", async () => {
    const response = await call({ authorization: "Bearer bad" });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain('error="invalid_token"');
  });

  test("a web page on another host is refused before the key is read", async () => {
    const response = await call({
      authorization: "Bearer good",
      origin: "https://evil.example",
    });
    expect(response.status).toBe(403);
  });

  test("a good key is served, from no origin, its own or localhost", async () => {
    for (const origin of [
      undefined,
      "https://isms.example.com",
      "http://localhost:6274",
    ]) {
      const response = await call({
        authorization: "Bearer good",
        ...(origin ? { origin } : {}),
      });
      expect(await response.json()).toEqual({ servedFor: "u1" });
    }
  });

  test("the bearer scheme is read case-insensitively, and nothing else is a token", () => {
    expect(bearerToken("Bearer abc")).toBe("abc");
    expect(bearerToken("bearer abc")).toBe("abc");
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken("Bearer ")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});
