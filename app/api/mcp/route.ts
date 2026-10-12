import { allowedOrigins, RESOURCE_METADATA_PATH, urlOf } from "@/lib/mcp/config";
import { keyHolder } from "@/lib/mcp/context";
import { handleMcpRequest } from "@/lib/mcp/endpoint";
import { serveMcp } from "@/lib/mcp/server";

/**
 * The MCP endpoint for AI assistants (Streamable HTTP, stateless): POST only. A GET for a
 * server-sent stream gets 405, which tells a client this server pushes nothing.
 */
export const POST = (request: Request): Promise<Response> =>
  handleMcpRequest(request, {
    allowedOrigins: allowedOrigins(),
    holderOf: keyHolder,
    serve: serveMcp,
    resourceMetadataUrl: urlOf(RESOURCE_METADATA_PATH),
  });
