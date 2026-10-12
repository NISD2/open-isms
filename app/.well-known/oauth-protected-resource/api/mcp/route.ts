import { issuer, MCP_DOCS_PATH, mcpResource, urlOf } from "@/lib/mcp/config";

/**
 * The MCP endpoint's protected resource metadata (RFC 9728): the instance signs people in for it
 * itself. The endpoint's 401 points here, which is what makes a client open the browser.
 */
export const GET = (): Response =>
  Response.json({
    resource: mcpResource(),
    authorization_servers: [issuer()],
    bearer_methods_supported: ["header"],
    resource_name: "nisd2",
    resource_documentation: urlOf(MCP_DOCS_PATH),
  });
