/**
 * L2 export: the sidebar leads to the export page, every file it lists downloads as what it says,
 * the data file holds the company's records and nothing it must not, and nobody without a session
 * gets anything. Real UI, real Postgres; read only.
 */
import { expect, test } from "@playwright/test";
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
    await expect(page).toHaveURL(/\/de\/export$/, { timeout: 30_000 });

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

  test("the data file holds every record of the company, and no secret", async ({ page }) => {
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
    expect(text).not.toContain("unsubscribeToken");
  });

  test("without a session nothing downloads", async ({ browser, baseURL }) => {
    const anonymous = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    for (const path of ["data", "registers", "documents"]) {
      const res = await anonymous.request.get(`${baseURL}/api/export/${path}`);
      expect(res.status(), path).toBe(401);
    }
    await anonymous.close();
  });
});
