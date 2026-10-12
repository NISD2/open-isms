import { eq } from "drizzle-orm";
import { epochSeconds } from "@/lib/auth/session-age";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { instanceKey } from "@/lib/mcp/instance-key";
import { exchange, type TokenDeps } from "@/lib/mcp/oauth";
import { countHit, rateLimitPublicRoute } from "@/lib/rate-limit";
import { user } from "@/schema";

/** Longer than a code lives, so a code is never good twice. */
const CODE_LEDGER_MS = 2 * 60 * 1000;

const deps: TokenDeps = {
  versionOf: async (userId) => {
    const row = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { mcpKeyVersion: true },
    });
    return row?.mcpKeyVersion ?? null;
  },
  // The rate limiter's window, one hit allowed: atomic across replicas, and it throws rather than
  // failing open when the database cannot answer, so a code is refused instead of used twice.
  firstUse: async (codeHash) =>
    (await countHit(`mcp-code:${codeHash}`, 1, CODE_LEDGER_MS)).allowed,
};

const json = (status: number, body: Record<string, unknown>): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** The OAuth token endpoint for MCP clients (lib/mcp/oauth.ts). */
export async function POST(request: Request): Promise<Response> {
  if (!(await rateLimitPublicRoute("mcp-token", getClientIp(request.headers), 30))) {
    return json(429, { error: "slow_down", error_description: "Too many requests." });
  }
  const form = new URLSearchParams(await request.text());
  const outcome = await exchange(instanceKey(), form, deps, epochSeconds(new Date()));
  return outcome.ok
    ? json(200, outcome.body)
    : json(outcome.status, {
        error: outcome.error,
        error_description: outcome.description,
      });
}
