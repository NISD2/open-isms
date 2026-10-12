import {
  AUTHORIZE_PATH,
  issuer,
  REGISTER_PATH,
  TOKEN_PATH,
  urlOf,
} from "@/lib/mcp/config";

/**
 * The authorization server metadata (RFC 8414) for MCP clients: public clients with PKCE S256,
 * registered dynamically (RFC 7591). See lib/mcp/oauth.ts.
 */
export const GET = (): Response =>
  Response.json({
    issuer: issuer(),
    authorization_endpoint: urlOf(AUTHORIZE_PATH),
    token_endpoint: urlOf(TOKEN_PATH),
    registration_endpoint: urlOf(REGISTER_PATH),
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    authorization_response_iss_parameter_supported: true,
  });
