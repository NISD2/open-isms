import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { testMetadataUrl } from "@/lib/test-mcp/address";
import { holderOf } from "@/lib/test-mcp/context";
import { handleTestRequest, notFound } from "@/lib/test-mcp/endpoint";
import { serveTest } from "@/lib/test-mcp/server";

/**
 * The test MCP endpoint, at the secret address TEST_MCP_PATH names (lib/test-mcp). Streamable
 * HTTP, stateless, POST only. Every other address under /api/t, and every address when the
 * variable is unset, answers 404. At the right address a call without a valid key answers 401,
 * pointing at the sign-in (app/.well-known/oauth-protected-resource/api/t).
 */
interface Segment {
  readonly params: Promise<{ slug: string }>;
}

export const POST = async (request: Request, { params }: Segment): Promise<Response> => {
  const { slug } = await params;
  return handleTestRequest(request, slug, {
    secretPath: env.TEST_MCP_PATH,
    resourceMetadataUrl: testMetadataUrl(slug),
    holderOf,
    serve: serveTest,
    limit: rateLimit,
  });
};

/** Anything but POST answers 404, the same as a wrong address: nothing here says what it is. */
const missing = async (): Promise<Response> => notFound();

export const GET = missing;
export const DELETE = missing;
export const PUT = missing;
export const PATCH = missing;
export const HEAD = missing;
export const OPTIONS = missing;
