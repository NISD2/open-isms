/**
 * L3 MCP: an AI assistant puts a company's data into the walkthrough through /api/mcp, as the
 * person who connected it, and signs nothing. It adds an asset (2.2) and rates it (2.3, the risk
 * matrix); the rows land as the app's own screens write them, and the walkthrough marks the screen
 * it wrote. It uploads a file to storage and attaches it as evidence. Once management has signed
 * an item that relies on the risks, the assistant's next rating is refused and nothing changes:
 * changing a signed risk is the person's, in the app. Ending the key in Settings stops it.
 */
import { createHash } from "node:crypto";
import { type APIRequestContext, expect, test } from "@playwright/test";
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
import { E2E_USER_EMAIL } from "../lib/env";
import { allowAssistants, callTool as callAs, mcpHeaders } from "../lib/mcp";

const ASSET = "E2E MCP Buchhaltung";
/** A process that must keep running, so the assistant has something to link its asset to. */
const PROCESS = "E2E MCP Auftragsannahme";
const FILE_NAME = "e2e-mcp-inventar.pdf";
const FILE_BODY = Buffer.from("%PDF-1.4\n% e2e assistant evidence\n");
const FILE_SHA256 = createHash("sha256").update(FILE_BODY).digest("hex");
/**
 * The name this run's assistant goes by: a pasted key carries none, so its user agent names it.
 * New every run, so the company's log has rows from this run alone under it, and the once an hour
 * a read or refusal is logged starts fresh.
 */
const AGENT = `E2E Agent ${Date.now()}`;

/** One tool call as this run's assistant. */
const callTool = (
  request: APIRequestContext,
  key: string,
  name: string,
  args: Record<string, unknown>,
) => callAs(request, key, AGENT, name, args);

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

/** Removes what this spec added: the process (its links die with it), the asset, the risks on it. */
async function removeOurAssets(tenant: Tenant): Promise<void> {
  await e2eQuery(`DELETE FROM asset WHERE company_id = $1 AND name = $2`, [
    tenant.company_id,
    PROCESS,
  ]);
  const ids = (await ourAssets(tenant)).map((a) => a.id);
  if (ids.length === 0) return;
  const risks = (await risksOn(ids)).map((r) => r.id);
  // The links first: risk_asset points at both the risk and the asset.
  await e2eQuery(`DELETE FROM risk_asset WHERE asset_id = ANY($1::uuid[])`, [ids]);
  await e2eQuery(`DELETE FROM risk WHERE id = ANY($1::uuid[])`, [risks]);
  await e2eQuery(`DELETE FROM asset WHERE id = ANY($1::uuid[])`, [ids]);
}

/** Removes the evidence rows this spec's uploads made on the tenant's items. */
const removeOurFiles = (tenant: Tenant) =>
  e2eQuery(
    `DELETE FROM evidence e
      USING company_requirement_status s, company_assessment a
      WHERE e.requirement_status_id = s.id AND s.assessment_id = a.id
        AND a.company_id = $1 AND e.file_name = $2`,
    [tenant.company_id, FILE_NAME],
  );

/** Removes the tenant's records of what an assistant filled, so a mark seen comes from this run. */
const removeOurFills = (tenant: Tenant) =>
  e2eQuery(`DELETE FROM audit_log WHERE company_id = $1 AND action = 'mcp.item_filled'`, [
    tenant.company_id,
  ]);

const SIGNED_IN = "E2E Assistent";

/**
 * An assistant the e2e user signed in to the tenant, as the token endpoint opens it, under the
 * user's current key version; and its removal.
 */
async function signInAssistant(tenant: Tenant): Promise<{ id: string; undo: Undo }> {
  const [row] = await e2eQuery<{ id: string }>(
    `INSERT INTO mcp_connection (user_id, company_id, kind, client, key_version, expires_at)
     SELECT id, $2, 'signin', $3, mcp_key_version, NOW() + interval '1 day'
       FROM "user" WHERE email = $1
     RETURNING id`,
    [E2E_USER_EMAIL, tenant.company_id, SIGNED_IN],
  );
  if (!row) throw new Error("the e2e user is missing");
  return {
    id: row.id,
    undo: async () => {
      await e2eQuery(`DELETE FROM mcp_connection WHERE id = $1`, [row.id]);
    },
  };
}

/** The NIS 2 requirements whose sign-off relies on these registers. */
const registerRequirements = (modules: readonly string[]) =>
  e2eQuery<{ code: string }>(
    `SELECT r.code FROM requirement r
       JOIN requirement_category c ON c.id = r.category_id
       JOIN compliance_framework f ON f.id = c.framework_id
      WHERE f.code = 'nis2' AND r.module_ref = ANY($1::text[])
      ORDER BY r.code`,
    [modules],
  );

test.describe("an AI assistant fills the walkthrough over MCP", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];
  let key = "";

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    await removeOurAssets(tenant);
    await removeOurFills(tenant);
    const kept = await keepSignOffs(tenant);
    // Open for an assistant: set aside, unsigned, whatever the seed or earlier specs left, every
    // item cited by a register this spec writes (assets on 2.2; risks, and suppliers' ratings, on
    // 2.3), as a signed one refuses those writes. In the whole suite earlier specs happen to leave
    // them open; run alone, the seed has 4.3, 4.4, 10.2, 5.1 and 5.2 signed. keepSignOffs puts
    // every status back afterwards.
    const opened: Undo[] = [];
    for (const { code } of await registerRequirements(["asset", "risk", "supplier"])) {
      opened.push(await setAsideWalkItem(tenant, code));
    }
    // 4.2 writes a plan (module policy), but what the processes need is recorded there too.
    opened.push(await setAsideWalkItem(tenant, "4.2"));
    undos = [
      kept,
      await payFor(tenant),
      await allowAssistants(tenant),
      ...opened,
      () => removeOurAssets(tenant),
      () => removeOurFiles(tenant).then(() => {}),
      () => removeOurFills(tenant).then(() => {}),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("the person makes a key in Settings; an assistant signed in stays connected", async ({
    page,
  }) => {
    const signedIn = await signInAssistant(tenant);
    undos = [...undos, signedIn.undo];
    await page.goto("/de/settings");
    await page.getByRole("button", { name: "Schlüssel erzeugen" }).click();
    const field = page.getByLabel("Schlüssel", { exact: true });
    await expect(field).toHaveValue(/\S{20,}/);
    key = await field.inputValue();

    // A new key ends only the key before it.
    const [row] = await e2eQuery<{ ended_at: Date | null }>(
      `SELECT ended_at FROM mcp_connection WHERE id = $1`,
      [signedIn.id],
    );
    expect(row).toEqual({ ended_at: null });
    await expect(page.getByRole("listitem").filter({ hasText: SIGNED_IN })).toHaveCount(
      1,
    );
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

  test("the assistant records what a process needs (4.2) and how long that system takes back (4.4); the comparison stays the app's", async ({
    request,
  }) => {
    const [process] = await e2eQuery<{ id: string }>(
      `INSERT INTO asset (company_id, name, type, is_critical, max_outage)
       VALUES ($1, $2, 'process', true, 'day') RETURNING id`,
      [tenant.company_id, PROCESS],
    );
    const processId = process?.id ?? "";
    const assetId = (await ourAssets(tenant))[0]?.id ?? "";

    const needs = await callTool(request, key, "fill_walkthrough_item", {
      code: "4.2",
      screens: { needs: { rows: [{ processId, assetIds: [assetId] }] } },
    });
    expect(needs.ok, JSON.stringify(needs)).toBe(true);
    expect(
      await e2eQuery(`SELECT asset_id FROM process_asset WHERE process_id = $1`, [processId]),
    ).toEqual([{ asset_id: assetId }]);

    const restore = await callTool(request, key, "fill_walkthrough_item", {
      code: "4.4",
      screens: { restore: { rows: [{ assetId, restore: "hours", unknown: false }] } },
    });
    expect(restore.ok, JSON.stringify(restore)).toBe(true);
    expect(
      await e2eQuery(
        `SELECT restore_time, restore_time_unknown FROM asset WHERE id = $1`,
        [assetId],
      ),
    ).toEqual([{ restore_time: "hours", restore_time_unknown: false }]);

    // The tool names who fills each screen: the comparison only shows, so nobody does.
    const read = await callTool(request, key, "get_walkthrough", { code: "4.4" });
    const screens = read.ok
      ? (read.data.screens as ReadonlyArray<{ kind: string; filledBy: string }>)
      : [];
    expect(screens.find((s) => s.kind === "restore")?.filledBy).toBe("assistant");
    expect(screens.find((s) => s.kind === "recovery")?.filledBy).toBe("none");
  });

  test("the walkthrough marks the screen the assistant wrote, and only that one", async ({
    page,
    request,
  }) => {
    // The tool lists the item's screens as its page shows them, in the same order. 2.2 lists its
    // assets on four screens: business processes first, then the business applications the
    // assistant's own entry (an application) shows on.
    const read = await callTool(request, key, "get_walkthrough", { code: "2.2" });
    const screens = read.ok
      ? (read.data.screens as ReadonlyArray<{ readonly kind: string }>)
      : [];
    const [processes, applications] = screens.flatMap((s, index) =>
      s.kind === "assets" ? [index] : [],
    );
    expect(processes).toBeDefined();
    expect(applications).toBeDefined();
    const mark = page.getByText(/vom Assistenten .+ eingetragen/);
    await page.goto(`/de/durchgang/nis2/2.2?s=${applications}`);
    await expect(mark).toBeVisible({ timeout: 20_000 });

    // A screen of the same kind whose list it did not touch carries no mark.
    await page.goto(`/de/durchgang/nis2/2.2?s=${processes}`);
    await expect(page.locator("[data-dg-item]")).toBeVisible({ timeout: 20_000 });
    await expect(mark).toHaveCount(0);
  });

  test("the assistant uploads a file as the item's evidence; one never sent is refused", async ({
    request,
  }) => {
    const asked = await callTool(request, key, "upload_file", {
      code: "2.2",
      purpose: "evidence",
      fileName: FILE_NAME,
      contentType: "application/pdf",
      fileSize: FILE_BODY.length,
    });
    expect(asked.ok, JSON.stringify(asked)).toBe(true);
    const data = asked.ok ? asked.data : {};
    const upload = data.upload as {
      readonly method: string;
      readonly url: string;
      readonly headers: Record<string, string>;
    };
    const evidenceId = String(data.evidenceId);

    // The bytes go from the assistant straight to storage, with the headers the tool names.
    const put = await request.fetch(upload.url, {
      method: upload.method,
      headers: upload.headers,
      data: FILE_BODY,
    });
    expect(put.status(), await put.text()).toBe(200);

    const attached = await callTool(request, key, "fill_walkthrough_item", {
      code: "2.2",
      files: [{ evidenceId, contentHash: FILE_SHA256 }],
    });
    expect(attached.ok, JSON.stringify(attached)).toBe(true);
    expect(attached.ok ? attached.data.files : null).toEqual([
      { evidenceId, attached: true },
    ]);
    const [stored] = await e2eQuery<{ status: string; content_hash: string | null }>(
      `SELECT status, content_hash FROM evidence WHERE id = $1`,
      [evidenceId],
    );
    expect(stored).toEqual({ status: "in_review", content_hash: FILE_SHA256 });

    // Asked for, never sent: confirming finds no object and attaches nothing.
    const unsent = await callTool(request, key, "upload_file", {
      code: "2.2",
      purpose: "evidence",
      fileName: FILE_NAME,
      contentType: "application/pdf",
      fileSize: FILE_BODY.length,
    });
    const unsentId = String(unsent.ok ? unsent.data.evidenceId : "");
    const refused = await callTool(request, key, "fill_walkthrough_item", {
      code: "2.2",
      files: [{ evidenceId: unsentId }],
    });
    const files = refused.ok
      ? (refused.data.files as ReadonlyArray<Record<string, unknown>>)
      : [];
    expect(files).toEqual([
      { evidenceId: unsentId, refused: expect.stringContaining("not been uploaded") },
    ]);
  });

  test("once management has signed on the risks, the assistant's change is refused", async ({
    request,
  }) => {
    const codes = (await registerRequirements(["risk"])).map((r) => r.code);
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

  test("the company's log marks every row this assistant wrote as MCP, reads and refusals too", async ({
    page,
  }) => {
    const rows = await e2eQuery<{ action: string; via: string; description: string }>(
      `SELECT action, via, description FROM audit_log
        WHERE company_id = $1 AND user_agent = $2 ORDER BY created_at`,
      [tenant.company_id, `mcp: ${AGENT}`],
    );
    const actions = rows.map((r) => r.action);
    expect(
      rows.every((r) => r.via === "mcp"),
      JSON.stringify(rows),
    ).toBe(true);
    // The app's own procedures logged the saves, marked as the assistant's.
    expect(actions).toContain("evidence.createUploadUrl");
    expect(actions).toContain("mcp.item_filled");
    // get_walkthrough ran twice in this run, and logged once.
    expect(actions.filter((a) => a === "mcp.read")).toHaveLength(1);
    // The refusal on the signed risks, with its reason.
    const refused = rows.filter((r) => r.action === "mcp.refused");
    expect(refused).toHaveLength(1);
    expect(refused[0]?.description).toMatch(
      /^fill_walkthrough_item: .*(signed|signature)/,
    );

    // The person's own key, made in Settings, is theirs, not the assistant's.
    const [made] = await e2eQuery<{ via: string }>(
      `SELECT via FROM audit_log WHERE company_id = $1 AND action = 'user.createMcpKey'
        ORDER BY created_at DESC LIMIT 1`,
      [tenant.company_id],
    );
    expect(made).toEqual({ via: "app" });

    // The activity log shows the mark on the assistant's rows: the refusal is this run's newest.
    await page.goto("/de/audit");
    const shown = page
      .getByRole("listitem")
      .filter({ hasText: "Anfrage eines Assistenten abgelehnt" })
      .filter({ hasText: AGENT })
      .first();
    await expect(shown).toBeVisible({ timeout: 20_000 });
    await expect(shown.getByText("MCP", { exact: true })).toBeVisible();
  });

  test("the key ended in Settings stops at its next call", async ({ page, request }) => {
    await page.goto("/de/settings");
    const row = page.getByRole("listitem").filter({ hasText: "Eingefügter Schlüssel" });
    await expect(row).toHaveCount(1, { timeout: 20_000 });
    await row.getByRole("button", { name: "Eingefügter Schlüssel trennen" }).click();
    await expect(row).toHaveCount(0, { timeout: 20_000 });

    const response = await request.post("/api/mcp", {
      headers: mcpHeaders(key, AGENT),
      data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
    });
    expect(response.status()).toBe(401);
  });
});
