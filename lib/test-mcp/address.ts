import { issuer, urlOf } from "@/lib/mcp/config";

/**
 * Where the test endpoint and its sign-in metadata live. The last segment is the secret
 * (`TEST_MCP_PATH`), so every value built here is a secret too: never log one, never put one in an
 * answer to a caller who has not already named it.
 */
const ENDPOINT_ROOT = "/api/t";
/** RFC 9728: the metadata of a resource with a path sits at the well-known path plus that path. */
const METADATA_ROOT = `/.well-known/oauth-protected-resource${ENDPOINT_ROOT}`;

/** What a client names as `resource`, and a key is issued for. */
export const testResource = (secret: string): string =>
  `${issuer()}${ENDPOINT_ROOT}/${secret}`;

/** Where the endpoint's 401 sends a client to learn how to sign in. */
export const testMetadataUrl = (secret: string): string =>
  urlOf(`${METADATA_ROOT}/${secret}`);
