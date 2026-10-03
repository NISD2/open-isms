/**
 * L2 export: the sidebar leads to the export page, every file it lists downloads as what it says,
 * the data file holds the company's records and nothing it must not, and nobody without a session
 * gets anything. Real UI, real Postgres; read only.
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { e2eTenant, type Tenant } from "../lib/durchgang";

test.describe("export", () => {
  let tenant: Tenant;

  test.beforeAll(async () => {
    tenant = await e2eTenant();
  });

  test("the sidebar leads to it, and every file downloads as what it says", async ({
    page,
  }) => {
    await page.goto("/de/team");
    await page.getByRole("link", { name: "Export", exact: true }).first().click();
    // German is the default locale and carries no prefix.
    await expect(page).toHaveURL(/\/export$/, { timeout: 30_000 });

    const links = page.locator("main a[download]");
    await expect(links).toHaveCount(5, { timeout: 30_000 });
    const hrefs = await links.evaluateAll((as) =>
      as.map((a) => a.getAttribute("href") ?? ""),
    );
    const types = await Promise.all(
      hrefs.map(async (href) => {
        const res = await page.request.get(href);
        expect(res.status(), href).toBe(200);
        expect(res.headers()["content-disposition"], href).toContain("attachment");
        return (res.headers()["content-type"] ?? "").split(";")[0];
      }),
    );
    expect(types.toSorted()).toEqual([
      "application/json",
      "application/pdf",
      "application/pdf",
      "application/pdf",
      "text/csv",
    ]);
  });

  test("the data file holds every record of the company, and no secret", async ({
    page,
  }) => {
    const res = await page.request.get("/api/export/data");
    expect(res.status()).toBe(200);
    const text = await res.text();
    const data = JSON.parse(text);
    expect(data.company.name).toBe(tenant.company_name);
    expect(data.requirements).toHaveLength(49);
    for (const key of [
      "documents",
      "assets",
      "suppliers",
      "risks",
      "trainings",
      "managementReviews",
      "incidents",
    ]) {
      expect(Array.isArray(data[key]), key).toBe(true);
    }
    expect(typeof data.answers).toBe("object");
    // No supplier's bearer token, by value, whatever the field would be called.
    const tokens = await e2eQuery<{ token: string }>(
      `SELECT unsubscribe_token AS token FROM supplier
        WHERE customer_company_id = $1 AND unsubscribe_token IS NOT NULL`,
      [tenant.company_id],
    );
    for (const { token } of tokens) expect(text).not.toContain(token);
  });

  test("everything in one document: every section, the risk matrix, and a way to save it", async ({
    page,
  }) => {
    await page.goto("/de/export");
    await page.getByRole("link", { name: "Alles in einem Dokument" }).click();
    await expect(page).toHaveURL(/\/export\/gesamt$/, { timeout: 30_000 });

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Gesamtdokumentation",
      { timeout: 30_000 },
    );
    await expect(page.getByText(tenant.company_name).first()).toBeVisible();
    for (const section of [
      "Stand der Umsetzung",
      "Was noch offen ist",
      "Dokumente",
      "Risiken",
      "Assets",
      "Lieferanten",
      "Schulungen",
      "Managementbewertungen",
      "Vorfälle",
      "Angaben je Bereich",
      "Ab jetzt in Ihrer Hand",
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name: section, exact: true }),
      ).toBeVisible();
    }
    // The walk's matrix: its legend names the four levels.
    await expect(page.getByRole("list", { name: "Legende" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Als PDF speichern" })).toBeVisible();
  });

  test("without a session nothing downloads", async ({ browser, baseURL }) => {
    const anonymous = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    for (const path of ["data", "registers", "documents"]) {
      const res = await anonymous.request.get(`${baseURL}/api/export/${path}`);
      expect(res.status(), path).toBe(401);
    }
    const page = await anonymous.newPage();
    await page.goto(`${baseURL}/de/export/gesamt`);
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 30_000 });
    await anonymous.close();
  });
});
