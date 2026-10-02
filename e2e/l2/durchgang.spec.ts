/**
 * L2 Durchgang: one item walked to its done screen through the real UI, and a save the server
 * refuses. The walk moves ahead before the write settles, so the refused save has to bring the
 * person back to the screen that failed, with what they typed still there (spec §0.7).
 *
 * Target: 11.2, the shortest item with a form. The Durchgang is for paid accounts only, so the
 * tenant is lifted to "full" for this file and put back afterwards, together with the 11.2
 * answers, because later layers sign off against this tenant.
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  intakeRows,
  keepAnswers,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

const CODE = "11.2";
const CATEGORY = "AUT";
const FIELDS_SCREEN = 2;
const TOOLS = "#dg-secureCommsTools";

const itemDoneCount = async (companyId: string) => {
  const [row] = await e2eQuery<{ n: string }>(
    `SELECT count(*) AS n FROM audit_log WHERE company_id = $1 AND action = 'durchgang.item_done'`,
    [companyId],
  );
  return Number(row?.n ?? 0);
};

test.describe("durchgang", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [await keepAnswers(tenant, CATEGORY), await payFor(tenant)];
  });

  test.afterAll(() => undoAll(undos));

  test("a refused save brings the person back to its screen, input kept", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname.includes("intake.saveRequirementAnswers"),
      (route) =>
        route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );

    await page.goto(`/de/durchgang/nis2/${CODE}?s=${FIELDS_SCREEN}`);
    const tools = page.locator(TOOLS);
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(tools).toBeVisible({ timeout: 30_000 });

    // A required field left empty holds the screen and offers the way out instead.
    await tools.fill("");
    await expect(next).toBeDisabled();
    await expect(page.getByRole("button", { name: "Geht noch nicht" })).toBeVisible();

    await tools.fill("Abgewiesene Eingabe");
    await next.click();

    await expect(
      page.getByText("Das wurde nicht gespeichert.", { exact: false }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]s=${FIELDS_SCREEN}\\b`));
    await expect(tools).toHaveValue("Abgewiesene Eingabe");

    const rows = await intakeRows(tenant, CATEGORY);
    expect(rows.some((r) => r.answers?.secureCommsTools === "Abgewiesene Eingabe")).toBe(
      false,
    );
  });

  test("walks 11.2 to its done screen and records the answers", async ({ page }) => {
    const doneBefore = await itemDoneCount(tenant.company_id);

    // The item's old address, from before the walk moved under /durchgang/nis2, still leads to it.
    await page.goto(`/de/durchgang/${CODE}`);
    await expect(page).toHaveURL(new RegExp(`/de/durchgang/nis2/${CODE}$`));
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(next).toBeVisible({ timeout: 30_000 });
    await next.click();
    await next.click();

    await page.locator(TOOLS).fill("Signal für Notfälle, Microsoft Teams im Alltag");
    await next.click();

    await expect(
      page.getByRole("heading", { name: "Ihre Kommunikation ist festgehalten" }),
    ).toBeVisible();

    await expect
      .poll(async () => {
        const rows = await intakeRows(tenant, CATEGORY);
        return rows.find((r) => r.answers?.secureCommsTools)?.answers ?? null;
      })
      .toMatchObject({
        secureCommsTools: "Signal für Notfälle, Microsoft Teams im Alltag",
      });
    await expect.poll(() => itemDoneCount(tenant.company_id)).toBe(doneBefore + 1);
  });
});
