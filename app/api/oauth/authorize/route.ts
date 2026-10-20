import { epochSeconds } from "@/lib/auth/session-age";
import { getClientIp } from "@/lib/client-ip";
import { env } from "@/lib/env";
import { mcpResource, urlOf } from "@/lib/mcp/config";
import { consentPath } from "@/lib/mcp/consent-path";
import { instanceKey } from "@/lib/mcp/instance-key";
import { authorize } from "@/lib/mcp/oauth";
import { rateLimitPublicRoute } from "@/lib/rate-limit";
import { testResource } from "@/lib/test-mcp/address";

const plain = (status: number, message: string): Response =>
  new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });

/**
 * The OAuth authorization endpoint for MCP clients. It only checks the request: the person
 * signs in and decides on the consent page, which the proxy puts behind the sign-in like every
 * page of the app. A request it refuses is answered here and sent nowhere. Counted per client
 * address, since a request that names the test endpoint's secret address as its resource is told
 * apart from one that does not.
 */
export async function GET(request: Request): Promise<Response> {
  if (!(await rateLimitPublicRoute("mcp-authorize", getClientIp(request.headers), 30))) {
    return plain(429, "Too many requests.");
  }
  const outcome = authorize(
    instanceKey(),
    new URL(request.url).searchParams,
    mcpResource(),
    epochSeconds(new Date()),
    env.TEST_MCP_PATH === undefined ? undefined : testResource(env.TEST_MCP_PATH),
  );
  return outcome.kind === "consent"
    ? Response.redirect(urlOf(consentPath(outcome.request)), 302)
    : plain(400, outcome.message);
}
