import { epochSeconds } from "@/lib/auth/session-age";
import { getClientIp } from "@/lib/client-ip";
import { instanceKey } from "@/lib/mcp/instance-key";
import { registerClient } from "@/lib/mcp/oauth";
import { rateLimitPublicRoute } from "@/lib/rate-limit";

const json = (status: number, body: Record<string, unknown>): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

const parseJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

/**
 * Dynamic client registration (RFC 7591) for MCP clients. Nothing is stored: the client id is
 * the signed registration (lib/mcp/oauth.ts).
 */
export async function POST(request: Request): Promise<Response> {
  if (!(await rateLimitPublicRoute("mcp-register", getClientIp(request.headers), 10))) {
    return json(429, { error: "slow_down", error_description: "Too many requests." });
  }
  const registered = registerClient(
    instanceKey(),
    await parseJson(request),
    epochSeconds(new Date()),
  );
  return registered.ok
    ? json(201, registered.client)
    : json(400, { error: registered.error, error_description: registered.description });
}
