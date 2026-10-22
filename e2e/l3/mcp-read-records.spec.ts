/**
 * L3 MCP: an assistant reads the company's records with read_records, one part a page at a time,
 * exactly as the export file holds them. Only once the admin lets assistants read them, only
 * someone who may export, only on a paid plan; a column the export leaves out (a supplier's access token) never reaches the assistant;
 * the pages joined are the file's rows; a read and a download each leave one row in the log.
 */
import { createHash, randomBytes } from "node:crypto";
import { type APIRequestContext, expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { e2eTenant, payFor, type Tenant, type Undo, undoAll } from "../lib/durchgang";
import { E2E_MANAGER_EMAIL, E2E_STORAGE_STATE_MANAGER, E2E_USER_EMAIL } from "../lib/env";
import {
  allowAssistants,
  callTool,
  keyFromSettings,
  listTools,
  type ToolResult,
} from "../lib/mcp";

/** This run's assistant: its own name, so the log rows this run wrote are found by it. */
const AGENT = `E2E Reader ${Date.now()}`;
const VULNERABILITY = "E2E MCP veraltetes Plugin";
const SUPPLIER = "E2E MCP Lieferant mit Zugang";
const KPI = "E2E MCP Patchquote";
/** More than a page, so the second page has rows. */
const KPI_ROWS = 51;
const TOKEN = randomBytes(32).toString("hex");

type Page = {
  readonly rows: ReadonlyArray<Record<string, unknown>>;
  readonly more: boolean;
  readonly next: string | null;
};

const pageOf = (result: ToolResult): Page => {
  expect(result.ok, JSON.stringify(result)).toBe(true);
  return (result.ok ? result.data : {}) as unknown as Page;
};

/** Every page of a part, read as an assistant pages through it. */
async function allPages(
  request: APIRequestContext,
  key: string,
  part: string,
): Promise<ReadonlyArray<Record<string, unknown>>> {
  const read = async (page: number): Promise<ReadonlyArray<Record<string, unknown>>> => {
    const got = pageOf(
      await callTool(request, key, AGENT, "read_records", { part, page }),
    );
    return got.more ? [...got.rows, ...(await read(page + 1))] : got.rows;
  };
  return read(1);
}

/** The rows this spec adds, and their removal. */
async function seed(tenant: Tenant): Promise<Undo> {
  await e2eQuery(
    `INSERT INTO vulnerability (company_id, title, severity, status, source, cve_id)
     VALUES ($1, $2, 'high', 'treating', 'pentest', 'CVE-2026-4242')`,
    [tenant.company_id, VULNERABILITY],
  );
  await e2eQuery(
    `INSERT INTO kpi_measurement (company_id, kpi_name, measured_at, value, target, unit)
     SELECT $1, $2, TIMESTAMP '2026-01-01' + n * interval '1 day', n, 95, '%'
       FROM generate_series(1, $3::int) AS n`,
    [tenant.company_id, KPI, KPI_ROWS],
  );
  await e2eQuery(
    `INSERT INTO supplier (customer_company_id, name, unsubscribe_token)
     VALUES ($1, $2, $3)`,
    [tenant.company_id, SUPPLIER, TOKEN],
  );
  return async () => {
    await e2eQuery(`DELETE FROM vulnerability WHERE company_id = $1 AND title = $2`, [
      tenant.company_id,
      VULNERABILITY,
    ]);
    await e2eQuery(
      `DELETE FROM kpi_measurement WHERE company_id = $1 AND kpi_name = $2`,
      [tenant.company_id, KPI],
    );
    await e2eQuery(`DELETE FROM supplier WHERE customer_company_id = $1 AND name = $2`, [
      tenant.company_id,
      SUPPLIER,
    ]);
  };
}

/**
 * Lets this run's download leave its log row: the row is written once an hour per person and
 * kind (lib/export/access.ts `logTakenOut`), counted under this hashed key (lib/rate-limit-rules.ts
 * `windowKey`), so a second run within the hour would otherwise find the window taken.
 */
async function freshDownloadWindow(email: string): Promise<void> {
  const [person] = await e2eQuery<{ id: string }>(
    `SELECT id FROM "user" WHERE email = $1`,
    [email],
  );
  if (!person) throw new Error(`no user ${email}`);
  const key = createHash("sha256").update(`export-log:data:${person.id}`).digest("hex");
  await e2eQuery(`DELETE FROM rate_limit_window WHERE key = $1`, [key]);
}

/** Starts with reading the records off, as every company does, and puts back what it was. */
async function recordsSwitchBack(tenant: Tenant): Promise<Undo> {
  const [before] = await e2eQuery<{ assistants_read_records: boolean }>(
    `SELECT assistants_read_records FROM company WHERE id = $1`,
    [tenant.company_id],
  );
  const set = (on: boolean) =>
    e2eQuery(`UPDATE company SET assistants_read_records = $2 WHERE id = $1`, [
      tenant.company_id,
      on,
    ]);
  await set(false);
  return async () => {
    await set(before?.assistants_read_records ?? false);
  };
}

/** The person's role and job title in the tenant, set for a step and put back. */
async function actAs(
  tenant: Tenant,
  role: string,
  jobTitle: string | null,
): Promise<Undo> {
  const [before] = await e2eQuery<{ role: string; job_title: string | null }>(
    `SELECT m.role, m.job_title FROM company_membership m JOIN "user" u ON u.id = m.user_id
      WHERE u.email = $1 AND m.company_id = $2`,
    [E2E_USER_EMAIL, tenant.company_id],
  );
  if (!before) throw new Error("the e2e user is no member of the tenant");
  const set = (r: string, j: string | null) =>
    e2eQuery(
      `UPDATE company_membership m SET role = $3, job_title = $4 FROM "user" u
        WHERE u.id = m.user_id AND u.email = $1 AND m.company_id = $2`,
      [E2E_USER_EMAIL, tenant.company_id, r, j],
    );
  await set(role, jobTitle);
  return async () => {
    await set(before.role, before.job_title);
  };
}

test.describe("an AI assistant reads the company's records over MCP", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];
  let key = "";

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await payFor(tenant),
      await allowAssistants(tenant),
      await recordsSwitchBack(tenant),
      await seed(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("nothing is read until the admin lets assistants read the records in Settings", async ({
    page,
    request,
  }) => {
    key = await keyFromSettings(page);
    const readsLine = page.getByText(
      "Da Sie die Aufzeichnungen des Unternehmens exportieren dürfen",
    );
    // Assistants are allowed, reading the records is not: off for every company until an admin says.
    await expect(readsLine).toBeHidden();
    const refused = await callTool(request, key, AGENT, "read_records", {
      part: "assets",
      language: "en",
    });
    expect(refused.ok).toBe(false);
    expect(refused.ok ? "" : refused.message).toContain("has not let assistants read");

    const recordsSwitch = page.getByRole("switch", {
      name: "Assistenten die Aufzeichnungen lesen lassen",
    });
    await expect(recordsSwitch).not.toBeChecked();
    await recordsSwitch.click();
    await expect(page.getByText("können die Aufzeichnungen lesen.")).toBeVisible();
    await page.reload();
    await expect(recordsSwitch).toBeChecked();
    await expect(readsLine).toBeVisible();
    expect(await listTools(request, key, AGENT)).toContain("read_records");
  });

  test("a register reads as the export holds it, nothing it leaves out", async ({
    request,
  }) => {
    const vulnerabilities = await allPages(request, key, "vulnerabilities");
    const ours = vulnerabilities.find((v) => v.title === VULNERABILITY);
    expect(ours).toMatchObject({
      cveId: "CVE-2026-4242",
      severity: "high",
      status: "treating",
      source: "pentest",
    });
    // The export's fields, never the row's ids.
    for (const row of vulnerabilities) {
      expect(Object.keys(row)).not.toContain("id");
      expect(Object.keys(row)).not.toContain("companyId");
    }

    // A supplier's access token is on its row and in no part of the records.
    const suppliers = await allPages(request, key, "suppliers");
    expect(suppliers.map((s) => s.name)).toContain(SUPPLIER);
    expect(JSON.stringify(suppliers)).not.toContain(TOKEN);
    expect(JSON.stringify(suppliers)).not.toContain("unsubscribeToken");
  });

  test("a register longer than a page reads a page at a time, none repeated or skipped", async ({
    request,
  }) => {
    const [{ count }] = await e2eQuery<{ count: string }>(
      `SELECT count(*) FROM kpi_measurement WHERE company_id = $1`,
      [tenant.company_id],
    );
    const total = Number(count);
    expect(total).toBeGreaterThan(50);

    const first = pageOf(
      await callTool(request, key, AGENT, "read_records", { part: "kpis", page: 1 }),
    );
    expect(first.rows).toHaveLength(50);
    expect(first.more).toBe(true);
    expect(first.next).toContain("page 2");

    const all = await allPages(request, key, "kpis");
    expect(all).toHaveLength(total);
    const ours = all.filter((k) => k.kpiName === KPI).map((k) => Number(k.value));
    expect(ours).toEqual(Array.from({ length: KPI_ROWS }, (_, i) => i + 1));
  });

  test("the company is one record, and a document is read one at a time", async ({
    request,
  }) => {
    const company = await callTool(request, key, AGENT, "read_records", {
      part: "company",
    });
    expect(company.ok, JSON.stringify(company)).toBe(true);
    expect(company.ok ? company.data.record : null).toMatchObject({
      name: tenant.company_name,
    });
    const second = await callTool(request, key, AGENT, "read_records", {
      part: "company",
      page: 2,
    });
    expect(second.ok).toBe(false);

    const documents = pageOf(
      await callTool(request, key, AGENT, "read_records", { part: "documents" }),
    );
    expect(documents.rows.length).toBeLessThanOrEqual(1);
  });

  test("the export file holds what the pages hold, and the download is logged", async ({
    browser,
    page,
    request,
  }) => {
    // Downloaded by management, who may export too: a download is logged once an hour per person,
    // and the export spec has the admin download the same file earlier in the run, which the
    // server remembers in memory as well as in the table.
    await freshDownloadWindow(E2E_MANAGER_EMAIL);
    // The database's own clock, as the log row's time is, so the row found is this download's.
    const [clock] = await e2eQuery<{ start: string }>(
      `SELECT now()::timestamp::text AS start`,
    );
    const manager = await browser.newContext({ storageState: E2E_STORAGE_STATE_MANAGER });
    const download = await manager.request.get("/api/export/data");
    expect(download.status()).toBe(200);
    const file = (await download.json()) as Record<string, unknown>;
    await manager.close();
    for (const part of ["vulnerabilities", "kpis", "suppliers"]) {
      expect(
        JSON.parse(JSON.stringify(await allPages(request, key, part))),
        part,
      ).toEqual(file[part]);
    }
    expect(JSON.stringify(file)).not.toContain(TOKEN);

    const rows = await e2eQuery<{ via: string; description: string; has_agent: boolean }>(
      `SELECT a.via, a.description, a.user_agent IS NOT NULL AS has_agent
         FROM audit_log a JOIN "user" u ON u.id = a.user_id
        WHERE a.company_id = $1 AND a.action = 'export.downloaded'
          AND a.created_at >= $2::timestamp AND u.email = $3`,
      [tenant.company_id, clock?.start, E2E_MANAGER_EMAIL],
    );
    expect(rows).toEqual([{ via: "app", description: "data", has_agent: true }]);

    // A request the route refuses after the access check leaves no row: the CSV without its
    // assessment is a 400, and logs nothing.
    const refused = await page.request.get("/api/export/csv");
    expect(refused.status()).toBe(400);
    const csvRows = await e2eQuery<{ n: string }>(
      `SELECT count(*) AS n FROM audit_log
        WHERE company_id = $1 AND action = 'export.downloaded' AND description = 'csv'
          AND created_at >= $2::timestamp`,
      [tenant.company_id, clock?.start],
    );
    expect(csvRows).toEqual([{ n: "0" }]);
  });

  test("this run's many reads left one row in the log, marked MCP", async () => {
    const rows = await e2eQuery<{ action: string; via: string; description: string }>(
      `SELECT action, via, description FROM audit_log
        WHERE company_id = $1 AND user_agent = $2`,
      [tenant.company_id, `mcp: ${AGENT}`],
    );
    const reads = rows.filter((r) => r.action === "mcp.read");
    expect(reads).toEqual([
      { action: "mcp.read", via: "mcp", description: "read_records" },
    ]);
  });

  test("someone who may not export reads nothing", async ({ request }) => {
    const undo = await actAs(tenant, "member", null);
    try {
      const refused = await callTool(request, key, AGENT, "read_records", {
        part: "assets",
        language: "en",
      });
      expect(refused.ok).toBe(false);
      expect(refused.ok ? "" : refused.message).toContain("may export");
    } finally {
      await undo();
    }
    // Management may, though it is no admin.
    const undoManagement = await actAs(tenant, "member", "ceo");
    try {
      pageOf(await callTool(request, key, AGENT, "read_records", { part: "assets" }));
    } finally {
      await undoManagement();
    }
  });

  test("an account without the walkthrough's plan reads nothing", async ({ request }) => {
    await e2eQuery(`UPDATE billing_account SET access_level = 'free' WHERE id = $1`, [
      tenant.billing_account_id,
    ]);
    try {
      const refused = await callTool(request, key, AGENT, "read_records", {
        part: "assets",
        language: "en",
      });
      expect(refused.ok).toBe(false);
      expect(refused.ok ? "" : refused.message).toContain("not unlocked");
    } finally {
      await e2eQuery(`UPDATE billing_account SET access_level = 'full' WHERE id = $1`, [
        tenant.billing_account_id,
      ]);
    }
  });
});
