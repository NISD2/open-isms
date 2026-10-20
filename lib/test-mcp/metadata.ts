import { getClientIp } from "@/lib/client-ip";
import { issuer } from "@/lib/mcp/config";
import { publicRouteBudget } from "@/lib/rate-limit-rules";
import { testResource } from "./address";
import { isSecretPath, notFound } from "./endpoint";

/**
 * The sign-in metadata of the test endpoint (RFC 9728), as a plain Request to Response function.
 * It answers only for the secret address: a wrong one, none set, a request from a browser page or
 * a flood gets the endpoint's own 404. The answer names no purpose, only the resource the client
 * already asked for and the instance's authorization server, which is public.
 */
export interface TestMetadataDeps {
  /** TEST_MCP_PATH; undefined switches the endpoint off. */
  readonly secretPath: string | undefined;
  /** True while the client address has hits left in the window. */
  readonly limit: (key: string, max: number, windowMs: number) => Promise<boolean>;
}

const REQUESTS_PER_IP_PER_MINUTE = 60;
const MINUTE_MS = 60_000;

export async function handleTestMetadata(
  request: Request,
  givenPath: string,
  deps: TestMetadataDeps,
): Promise<Response> {
  if (!isSecretPath(deps.secretPath, givenPath) || request.headers.has("origin")) {
    return notFound();
  }
  const budget = publicRouteBudget(
    "test-mcp-meta-ip",
    getClientIp(request.headers),
    REQUESTS_PER_IP_PER_MINUTE,
  );
  // A limiter that fails counts as a spent budget, as at the endpoint's door.
  const within = await (async () => {
    try {
      return await deps.limit(budget.key, budget.limit, MINUTE_MS);
    } catch {
      return false;
    }
  })();
  if (!within) return notFound();
  return Response.json(
    {
      resource: testResource(givenPath),
      authorization_servers: [issuer()],
      bearer_methods_supported: ["header"],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
