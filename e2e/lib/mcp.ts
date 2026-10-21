/**
 * Calling the MCP server as an assistant does, for the specs that drive it (e2e/l3/mcp-*.spec.ts).
 */
import { type APIRequestContext, expect, type Page } from "@playwright/test";
import { e2eQuery } from "./db";
import type { Tenant, Undo } from "./durchgang";

export type ToolResult =
  | { readonly ok: true; readonly data: Record<string, unknown> }
  | { readonly ok: false; readonly message: string };

/** The JSON-RPC answer, sent as one JSON body or as one server-sent event. */
const rpcBody = (text: string): unknown => {
  if (text.trimStart().startsWith("{")) return JSON.parse(text);
  const line = text.split("\n").find((l) => l.startsWith("data:"));
  if (!line) throw new Error(`no JSON-RPC answer in: ${text.slice(0, 200)}`);
  return JSON.parse(line.slice("data:".length));
};

/** The headers an assistant sends with a pasted key; `agent` is the name it goes by. */
export const mcpHeaders = (key: string, agent: string) => ({
  authorization: `Bearer ${key}`,
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
  "mcp-protocol-version": "2025-06-18",
  "user-agent": agent,
});

/** One tool call over HTTP, as an assistant makes it with a pasted key. */
export async function callTool(
  request: APIRequestContext,
  key: string,
  agent: string,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const response = await request.post("/api/mcp", {
    headers: mcpHeaders(key, agent),
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    },
  });
  const text = await response.text();
  expect(response.status(), text).toBe(200);
  const body = rpcBody(text) as {
    readonly result?: {
      readonly content?: ReadonlyArray<{ readonly text?: string }>;
      readonly isError?: boolean;
    };
  };
  const out = body.result?.content?.[0]?.text ?? "";
  return body.result?.isError
    ? { ok: false, message: out }
    : { ok: true, data: JSON.parse(out) as Record<string, unknown> };
}

/** The tools the server lists for a key. */
export async function listTools(
  request: APIRequestContext,
  key: string,
  agent: string,
): Promise<readonly string[]> {
  const response = await request.post("/api/mcp", {
    headers: mcpHeaders(key, agent),
    data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
  });
  expect(response.status()).toBe(200);
  const body = rpcBody(await response.text()) as {
    readonly result?: { readonly tools?: ReadonlyArray<{ readonly name: string }> };
  };
  return (body.result?.tools ?? []).map((t) => t.name);
}

/** Lets the tenant's people connect assistants, as its admin does in Settings, and undoes it. */
export async function allowAssistants(tenant: Tenant): Promise<Undo> {
  const [before] = await e2eQuery<{ assistants_allowed: boolean }>(
    `SELECT assistants_allowed FROM company WHERE id = $1`,
    [tenant.company_id],
  );
  await e2eQuery(`UPDATE company SET assistants_allowed = true WHERE id = $1`, [
    tenant.company_id,
  ]);
  return async () => {
    await e2eQuery(`UPDATE company SET assistants_allowed = $2 WHERE id = $1`, [
      tenant.company_id,
      before?.assistants_allowed ?? false,
    ]);
  };
}

/** A key the signed-in person makes in Settings, as they would to paste it into an assistant. */
export async function keyFromSettings(page: Page): Promise<string> {
  await page.goto("/de/settings");
  await page.getByRole("button", { name: "Schlüssel erzeugen" }).click();
  const field = page.getByLabel("Schlüssel", { exact: true });
  await expect(field).toHaveValue(/\S{20,}/);
  return field.inputValue();
}
