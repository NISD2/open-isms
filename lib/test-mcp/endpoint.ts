import { createHash, timingSafeEqual } from "node:crypto";
import { getClientIp } from "@/lib/client-ip";
import { bearerToken } from "@/lib/mcp/endpoint";
import { publicRouteBudget } from "@/lib/rate-limit-rules";

/**
 * The test MCP endpoint as a plain Request to Response function, its dependencies passed in so the
 * checks run without a database. Nothing it says names what it is for. The address is a secret set
 * on the instance: a wrong one, or none set, answers 404 like any address that does not exist. A
 * request from a browser page or a flood is refused the same way. A caller who holds the address
 * but no valid key is told to sign in (401, pointing at the sign-in metadata), which is what lets
 * an assistant open the browser; anyone without the address learns nothing.
 */

export interface TestEndpointDeps<H extends { readonly userId: string }> {
  /** TEST_MCP_PATH; undefined switches the endpoint off. */
  readonly secretPath: string | undefined;
  /** Where a client learns how to sign in; named in the 401. It holds the secret address. */
  readonly resourceMetadataUrl: string;
  /** The holder a key belongs to while they still may hold one; null for any other key. */
  readonly holderOf: (token: string, request: Request) => Promise<H | null>;
  /** The MCP handler. It trusts the holder it is given, so only this file may call it. */
  readonly serve: (request: Request, holder: H) => Promise<Response>;
  /** True while the key has hits left in the window (the app's rate limiter in the route). */
  readonly limit: (key: string, max: number, windowMs: number) => Promise<boolean>;
}

/** The longest request body served, in characters; real calls are a few hundred. */
const MAX_BODY_CHARS = 64_000;

/** Requests a minute from one client address, counted once the address and Origin check pass. */
const REQUESTS_PER_IP_PER_MINUTE = 60;
/** Requests a minute from one person, counted once their key has been accepted. */
const REQUESTS_PER_PERSON_PER_MINUTE = 120;
const MINUTE_MS = 60_000;

const digest = (text: string): Buffer => createHash("sha256").update(text).digest();

/** Compared as digests, so the time taken says nothing about how much of the address matched. */
export const isSecretPath = (secretPath: string | undefined, given: string): boolean =>
  secretPath !== undefined && timingSafeEqual(digest(secretPath), digest(given));

/**
 * The answer to everything this endpoint refuses. It says only that nothing is here; the route's
 * existence is visible in the public source, the address and the key are not.
 */
export const notFound = (): Response =>
  new Response("Not Found", {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain",
      "x-robots-tag": "noindex",
    },
  });

/**
 * For a caller who named the address but holds no valid key: where to sign in (RFC 9728). It does
 * not say whether a key was sent or why it failed beyond the standard `invalid_token`.
 */
const unauthorized = (metadataUrl: string, sentKey: boolean): Response =>
  Response.json(
    { error: "unauthorized" },
    {
      status: 401,
      headers: {
        "cache-control": "no-store",
        "www-authenticate": `Bearer ${sentKey ? 'error="invalid_token", ' : ""}resource_metadata="${metadataUrl}"`,
      },
    },
  );

const refusal = (status: 400 | 413, error: string): Response =>
  Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

/** An authenticated caller over their budget is told so, and when to come back. */
const tooMany = (): Response =>
  Response.json(
    { error: "Too many requests." },
    { status: 429, headers: { "cache-control": "no-store", "retry-after": "60" } },
  );

/**
 * One call per request: a JSON-RPC batch would run many tool calls under one rate-limit hit, and
 * a long body is no call this server has. Read from a clone, so the handler still gets the body.
 */
async function bodyRefusal(request: Request): Promise<Response | null> {
  const body = await request.clone().text();
  if (body.length > MAX_BODY_CHARS) return refusal(413, "Request too large.");
  if (body.trimStart().startsWith("["))
    return refusal(400, "Send one request at a time.");
  return null;
}

export async function handleTestRequest<H extends { readonly userId: string }>(
  request: Request,
  givenPath: string,
  deps: TestEndpointDeps<H>,
): Promise<Response> {
  // An assistant calls from a program, never from a web page: any request a browser sends on a
  // page's behalf carries an Origin, and none is served.
  if (!isSecretPath(deps.secretPath, givenPath) || request.headers.has("origin")) {
    return notFound();
  }
  // The limiter is a ceiling on abuse, not a guarantee: lib/rate-limit.ts itself lets calls
  // through for a few seconds after a database timeout. Its own failure is treated here as a
  // spent budget, so an error can never open the door.
  const within = async (key: string, max: number): Promise<boolean> => {
    try {
      return await deps.limit(key, max, MINUTE_MS);
    } catch {
      return false;
    }
  };
  const ipBudget = publicRouteBudget(
    "test-mcp-door-ip",
    getClientIp(request.headers),
    REQUESTS_PER_IP_PER_MINUTE,
  );
  // Before any key check: a flood of guesses costs no database or signature work, and is told
  // nothing a wrong address is not.
  if (!(await within(ipBudget.key, ipBudget.limit))) return notFound();

  const token = bearerToken(request.headers.get("authorization"));
  const holder = token ? await deps.holderOf(token, request) : null;
  // Only a caller who already holds the address is told a key is asked for, and where to get one.
  if (!holder) return unauthorized(deps.resourceMetadataUrl, token !== null);

  if (!(await within(`test-mcp-door:${holder.userId}`, REQUESTS_PER_PERSON_PER_MINUTE))) {
    return tooMany();
  }
  return (await bodyRefusal(request)) ?? deps.serve(request, holder);
}
