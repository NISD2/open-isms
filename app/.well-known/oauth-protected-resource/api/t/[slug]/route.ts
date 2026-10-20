import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { notFound } from "@/lib/test-mcp/endpoint";
import { handleTestMetadata } from "@/lib/test-mcp/metadata";

/**
 * The sign-in metadata of the test endpoint (lib/test-mcp/metadata.ts), at the endpoint's own
 * secret address under the well-known path. The endpoint's 401 points here, which is what makes
 * an assistant open the browser. Every address but the secret one answers 404.
 */
interface Segment {
  readonly params: Promise<{ slug: string }>;
}

export const GET = async (request: Request, { params }: Segment): Promise<Response> =>
  handleTestMetadata(request, (await params).slug, {
    secretPath: env.TEST_MCP_PATH,
    limit: rateLimit,
  });

/** Anything but GET answers 404, the same as a wrong address. */
const missing = async (): Promise<Response> => notFound();

export const POST = missing;
export const DELETE = missing;
export const PUT = missing;
export const PATCH = missing;
export const HEAD = missing;
export const OPTIONS = missing;
