import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { epochSeconds } from "@/lib/auth/session-age";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { connectionOpen, openConnection } from "@/lib/mcp/connections";
import { instanceKey } from "@/lib/mcp/instance-key";
import { bumpMcpKeyVersion, mcpKeyVersionOf } from "@/lib/mcp/key-version";
import { exchange, spendOn, type TokenDeps } from "@/lib/mcp/oauth";
import { countHit, rateLimitPublicRoute } from "@/lib/rate-limit";
import { personOf, testInstanceKey } from "@/lib/test-mcp/context";
import { testGrants } from "@/lib/test-mcp/oauth";

const deps: TokenDeps = {
  versionOf: (userId) => mcpKeyVersionOf(db, userId),
  spend: spendOn(countHit),
  revoke: async (userId) => {
    await bumpMcpKeyVersion(db, userId);
  },
  connect: async ({ expiresAtS, returnHost, ...connection }) => {
    const id = await openConnection(
      db,
      { ...connection, kind: "signin", expiresAt: new Date(expiresAtS * 1000) },
      new Date(),
    );
    // The record of which assistant the person connected and where it went back to.
    await logAudit({
      companyId: connection.companyId,
      userId: connection.userId,
      action: "mcp.connected",
      entityType: "mcp_connection",
      entityId: id,
      description: `${connection.client ?? "An assistant"}, back to ${returnHost}`,
      newValue: { client: connection.client, returnHost },
    });
    return id;
  },
  isOpen: (con, userId, companyId) =>
    connectionOpen(db, con, { userId, companyId }, new Date()),
};

const json = (status: number, body: Record<string, unknown>): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** The OAuth token endpoint for MCP clients (lib/mcp/oauth.ts). */
export async function POST(request: Request): Promise<Response> {
  if (!(await rateLimitPublicRoute("mcp-token", getClientIp(request.headers), 30))) {
    return json(429, { error: "slow_down", error_description: "Too many requests." });
  }
  const form = new URLSearchParams(await request.text());
  // The test endpoint's own sign-ins, only while it is switched on.
  const other =
    env.TEST_MCP_PATH === undefined
      ? undefined
      : testGrants(
          { instance: instanceKey(), test: testInstanceKey() },
          {
            person: personOf,
            isOperator: isPlatformAdmin,
            spend: deps.spend,
            revoke: deps.revoke,
          },
        );
  const outcome = await exchange(
    instanceKey(),
    form,
    deps,
    epochSeconds(new Date()),
    other,
  );
  return outcome.ok
    ? json(200, outcome.body)
    : json(outcome.status, {
        error: outcome.error,
        error_description: outcome.description,
      });
}
