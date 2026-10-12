import { originValidationResponse } from "@modelcontextprotocol/server";

/**
 * The MCP endpoint as a plain Request to Response function, so the route and the check script run
 * the same code. Stateless: every request is checked and served on its own. Its dependencies come
 * in from outside, so the checks here run without a database.
 */

export interface EndpointDeps<H> {
  /** Hostnames a browser may call from: this instance's own, and localhost for local clients. */
  readonly allowedOrigins: readonly string[];
  /** The holder of a key this instance signed and still honours; null for any other. */
  readonly holderOf: (token: string, request: Request) => Promise<H | null>;
  /** The MCP handler. It trusts the holder it is given, so only this file may call it. */
  readonly serve: (request: Request, holder: H) => Promise<Response>;
  /** Where a client sends the person to connect, named in every refusal. */
  readonly resourceMetadataUrl: string;
}

/** The token from `Authorization: Bearer <token>`; the scheme is case-insensitive (RFC 6750). */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const space = header.indexOf(" ");
  if (space < 0 || header.slice(0, space).toLowerCase() !== "bearer") return null;
  const token = header.slice(space + 1).trim();
  return token === "" ? null : token;
}

export async function handleMcpRequest<H>(
  request: Request,
  deps: EndpointDeps<H>,
): Promise<Response> {
  // A web page must not reach a local instance through the person's browser (DNS rebinding).
  const rejected = originValidationResponse(request, [...deps.allowedOrigins]);
  if (rejected) return rejected;
  const token = bearerToken(request.headers.get("authorization"));
  const holder = token ? await deps.holderOf(token, request) : null;
  if (!token || !holder) {
    const metadata = `resource_metadata="${deps.resourceMetadataUrl}"`;
    return Response.json(
      {
        error: "unauthorized",
        message:
          "Connect this assistant to your nisd2 account: sign in, or make a key in Settings.",
      },
      {
        status: 401,
        headers: {
          "cache-control": "no-store",
          "www-authenticate": token
            ? `Bearer error="invalid_token", ${metadata}`
            : `Bearer ${metadata}`,
        },
      },
    );
  }
  return deps.serve(request, holder);
}
