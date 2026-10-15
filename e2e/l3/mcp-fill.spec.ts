/**
 * L3 MCP: an AI assistant puts a company's data into the walkthrough through /api/mcp, as the
 * person who connected it, and signs nothing. It adds an asset (2.2) and rates it (2.3, the risk
 * matrix); the rows land as the app's own screens write them. Once management has signed an item
 * that relies on the risks, the assistant's next rating is refused and nothing changes: changing
 * a signed risk is the person's, in the app.
 */
import { type APIRequestContext, expect, test } from "@playwright/test";
import { WALK } from "@/lib/durchgang";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  keepSignOffs,
  payFor,
  setAsideWalkItem,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

const ASSET = "E2E MCP Buchhaltung";

type ToolResult =
  | { readonly ok: true; readonly data: Record<string, unknown> }
  | { readonly ok: false; readonly message: string };

/** The JSON-RPC answer, sent as one JSON body or as one server-sent event. */
const rpcBody = (text: string): unknown => {
  if (text.trimStart().startsWith("{")) return JSON.parse(text);
  const line = text.split("\n").find((l) => l.startsWith("data:"));
  if (!line) throw new Error(`no JSON-RPC answer in: ${text.slice(0, 200)}`);
  return JSON.parse(line.slice("data:".length));
};

/** One tool call over HTTP, as an assistant makes it with a pasted key. */
async function callTool(
  request: APIRequestContext,
  key: string,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const response = await request.post("/api/mcp", {
    headers: {
      authorization: `Bearer ${key}`,
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-06-18",
    },
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

/** The tenant's assets this spec added, by name. */
const ourAssets = (tenant: Tenant) =>
  e2eQuery<{ id: string }>(`SELECT id FROM asset WHERE company_id = $1 AND name = $2`, [
    tenant.company_id,
    ASSET,
  ]);

/** The risks rated on these assets. */
const risksOn = (assetIds: readonly string[]) =>
  e2eQuery<{ id: string; likelihood: number | null; impact: number | null }>(
    `SELECT r.id, r.likelihood, r.impact
       FROM risk r JOIN risk_asset ra ON ra.risk_id = r.id
      WHERE ra.asset_id = ANY($1::uuid[])`,
    [assetIds],
  );

/** Removes what the assistant added: the asset, and the risks rated on it. */
async function removeOurAssets(tenant: Tenant): Promise<void> {
  const ids = (await ourAssets(tenant)).map((a) => a.id);
  if (ids.length === 0) return;
  const risks = (await risksOn(ids)).map((r) => r.id);
  // The links first: risk_asset points at both the risk and the asset.
  await e2eQuery(`DELETE FROM risk_asset WHERE asset_id = ANY($1::uuid[])`, [ids]);
  await e2eQuery(`DELETE FROM risk WHERE id = ANY($1::uuid[])`, [risks]);
  await e2eQuery(`DELETE FROM asset WHERE id = ANY($1::uuid[])`, [ids]);
}

/** Lets the tenant's people connect assistants, as its admin does in Settings, and undoes it. */
async function allowAssistants(tenant: Tenant): Promise<Undo> {
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

/** The NIS 2 requirements whose sign-off relies on the risk register. */
const riskRequirements = () =>
  e2eQuery<{ code: string }>(
    `SELECT r.code FROM requirement r
       JOIN requirement_category c ON c.id = r.category_id
       JOIN compliance_framework f ON f.id = c.framework_id
      WHERE f.code = 'nis2' AND r.module_ref = 'risk'
      ORDER BY r.code`,
  );

test.describe("an AI assistant fills the walkthrough over MCP", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];
  let key = "";

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    await removeOurAssets(tenant);
    undos = [
      await keepSignOffs(tenant),
      await payFor(tenant),
      await allowAssistants(tenant),
      // Open for an assistant: set aside, unsigned, whatever earlier specs left.
      await setAsideWalkItem(tenant, "2.2"),
      await setAsideWalkItem(tenant, "2.3"),
      () => removeOurAssets(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("the person makes a key for their assistant in Settings", async ({ page }) => {
    await page.goto("/de/settings");
    await page.getByRole("button", { name: "Schlüssel erzeugen" }).click();
    const field = page.getByLabel("Schlüssel", { exact: true });
    await expect(field).toHaveValue(/\S{20,}/);
    key = await field.inputValue();
  });

  test("the assistant adds an asset and rates it, and signs nothing", async ({
    request,
  }) => {
    const read = await callTool(request, key, "get_walkthrough", { code: "2.2" });
    expect(read.ok, JSON.stringify(read)).toBe(true);
    const screens = read.ok
      ? (read.data.screens as ReadonlyArray<{ kind: string; filledBy: string }>)
      : [];
    expect(screens.find((s) => s.kind === "assets")?.filledBy).toBe("assistant");

    const added = await callTool(request, key, "fill_walkthrough_item", {
      code: "2.2",
      screens: {
        assets: { catalogIds: [], custom: [{ name: ASSET, layer: "anwendung" }] },
      },
    });
    expect(added.ok, JSON.stringify(added)).toBe(true);
    const assets = await ourAssets(tenant);
    expect(assets).toHaveLength(1);
    const assetId = assets[0]?.id ?? "";

    const rated = await callTool(request, key, "fill_walkthrough_item", {
      code: "2.3",
      screens: {
        rate: {
          rows: [
            { kind: "asset", id: assetId, frequency: "medium", impact: "considerable" },
          ],
        },
      },
    });
    expect(rated.ok, JSON.stringify(rated)).toBe(true);
    expect(await risksOn([assetId])).toHaveLength(1);

    // Filled, not finished: both items still wait for the person, and nothing is signed.
    const statuses = await e2eQuery<{ code: string; status: string }>(
      `SELECT r.code, s.status FROM company_requirement_status s
         JOIN requirement r ON r.id = s.requirement_id
         JOIN company_assessment a ON a.id = s.assessment_id
        WHERE a.company_id = $1 AND r.code = ANY($2)`,
      [tenant.company_id, ["2.2", "2.3"]],
    );
    for (const row of statuses) expect(row.status, row.code).not.toBe("completed");
  });

  test("the walkthrough marks the screen the assistant wrote", async ({ page }) => {
    const screens = WALK.find((item) => item.code === "2.2")?.screens ?? [];
    const assets = screens.findIndex((s) => s.kind === "assets");
    expect(assets).toBeGreaterThan(-1);
    await page.goto(`/de/durchgang/nis2/2.2?s=${assets}`);
    await expect(page.getByText(/Eingetragen von .+ am /)).toBeVisible({
      timeout: 20_000,
    });

    // A screen it did not write carries no mark.
    await page.goto("/de/durchgang/nis2/2.2?s=0");
    await expect(page.locator("[data-dg-item]")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Eingetragen von .+ am /)).toHaveCount(0);
  });

  test("once management has signed on the risks, the assistant's change is refused", async ({
    request,
  }) => {
    const codes = (await riskRequirements()).map((r) => r.code);
    expect(codes.length).toBeGreaterThan(0);
    await e2eQuery(
      `UPDATE company_requirement_status s SET status = 'completed'
         FROM requirement r, company_assessment a
        WHERE r.id = s.requirement_id AND a.id = s.assessment_id
          AND a.company_id = $1 AND r.code = ANY($2)`,
      [tenant.company_id, codes],
    );
    const [asset] = await ourAssets(tenant);
    const assetId = asset?.id ?? "";
    const before = await risksOn([assetId]);

    const refused = await callTool(request, key, "fill_walkthrough_item", {
      code: "2.3",
      screens: {
        rate: {
          rows: [{ kind: "asset", id: assetId, frequency: "rare", impact: "negligible" }],
        },
      },
    });
    expect(refused.ok).toBe(false);
    expect(refused.ok ? "" : refused.message).toMatch(/signed|signature/);
    expect(await risksOn([assetId])).toEqual(before);
  });
});
