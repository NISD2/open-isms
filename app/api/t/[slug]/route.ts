import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { holderOf } from "@/lib/test-mcp/context";
import { handleTestRequest, notFound } from "@/lib/test-mcp/endpoint";
import { serveTest } from "@/lib/test-mcp/server";

/**
 * The test MCP endpoint, at the secret address TEST_MCP_PATH names (lib/test-mcp). Streamable
 * HTTP, stateless, POST only. Every other address under /api/t, and every address when the
 * variable is unset, answers 404.
 */
interface Segment {
  readonly params: Promise<{ slug: string }>;
}

export const POST = async (request: Request, { params }: Segment): Promise<Response> =>
  handleTestRequest(request, (await params).slug, {
    secretPath: env.TEST_MCP_PATH,
    holderOf,
    serve: serveTest,
    limit: rateLimit,
  });

/** Anything but POST answers 404, the same as a wrong address: nothing here says what it is. */
const missing = async (): Promise<Response> => notFound();

export const GET = missing;
export const DELETE = missing;
export const PUT = missing;
export const PATCH = missing;
export const HEAD = missing;
export const OPTIONS = missing;
