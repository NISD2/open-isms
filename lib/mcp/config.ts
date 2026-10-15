import { localhostAllowedOrigins } from "@modelcontextprotocol/server";
import { getAppUrl } from "@/lib/utils";

/**
 * Where the MCP endpoint and its sign-in live, read off this instance's own address, so nisd2.eu
 * and every self-host serve the same paths and nothing is configured per install.
 */

export const MCP_PATH = "/api/mcp";
/** RFC 9728: the metadata of a resource with a path sits at the well-known path plus that path. */
export const RESOURCE_METADATA_PATH = `/.well-known/oauth-protected-resource${MCP_PATH}`;
export const AUTHORIZE_PATH = "/api/oauth/authorize";
export const TOKEN_PATH = "/api/oauth/token";
export const REGISTER_PATH = "/api/oauth/register";
export const MCP_DOCS_PATH = "/docs/self-hosting/mcp";

/** This instance's origin, which is also its OAuth issuer. */
export const issuer = (): string => new URL(getAppUrl()).origin;

/** The endpoint's own address: what a client names as `resource` and a token is issued for. */
export const mcpResource = (): string => `${issuer()}${MCP_PATH}`;

export const urlOf = (path: string): string => `${issuer()}${path}`;

/** Hostnames a browser may call the endpoint from: this instance's own, and localhost. */
export const allowedOrigins = (): readonly string[] => [
  new URL(getAppUrl()).hostname,
  ...localhostAllowedOrigins(),
];
