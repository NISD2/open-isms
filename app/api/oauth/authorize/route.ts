import { epochSeconds } from "@/lib/auth/session-age";
import { consentPath, mcpResource, urlOf } from "@/lib/mcp/config";
import { instanceKey } from "@/lib/mcp/instance-key";
import { authorize } from "@/lib/mcp/oauth";

/**
 * The OAuth authorization endpoint for MCP clients. It only checks the request: the person
 * signs in and decides on the consent page, which the proxy puts behind the sign-in like every
 * page of the app. A request it refuses is answered here and sent nowhere.
 */
export function GET(request: Request): Response {
  const outcome = authorize(
    instanceKey(),
    new URL(request.url).searchParams,
    mcpResource(),
    epochSeconds(new Date()),
  );
  return outcome.kind === "consent"
    ? Response.redirect(urlOf(consentPath(outcome.request)), 302)
    : new Response(outcome.message, {
        status: 400,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
}
