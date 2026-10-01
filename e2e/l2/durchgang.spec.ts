/**
 * L2 Durchgang: one item walked to its done screen through the real UI, and a save the server
 * refuses. The walk moves ahead before the write settles, so the refused save has to bring the
 * person back to the screen that failed, with what they typed still there (spec §0.7).
 *
 * Target: 12.3, the shortest item with a form. The Durchgang is for paid accounts only, so the
 * tenant is lifted to "full" for this file and put back afterwards, together with the 12.3
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

const CODE = "12.3";
const FIELDS_SCREEN = 2;

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
    undos = [await keepAnswers(tenant, "REG"), await payFor(tenant)];
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

    await page.goto(`/de/durchgang/${CODE}?s=${FIELDS_SCREEN}`);
    const name = page.locator("#dg-contactPersonName");
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(name).toBeVisible({ timeout: 30_000 });

    // A required field left empty holds the screen and offers the way out instead.
    await name.fill("");
    await expect(next).toBeDisabled();
    await expect(page.getByRole("button", { name: "Geht noch nicht" })).toBeVisible();

    await name.fill("Abgewiesene Eingabe");
    await page.locator("#dg-contactPersonEmail").fill("abgewiesen@example.com");
    await next.click();

    await expect(
      page.getByText("Das wurde nicht gespeichert.", { exact: false }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]s=${FIELDS_SCREEN}\\b`));
    await expect(name).toHaveValue("Abgewiesene Eingabe");

    const rows = await intakeRows(tenant, "REG");
    expect(rows.some((r) => r.answers?.contactPersonName === "Abgewiesene Eingabe")).toBe(
      false,
    );
  });

  test("walks 12.3 to its done screen and records the answers", async ({ page }) => {
    const doneBefore = await itemDoneCount(tenant.company_id);

    await page.goto(`/de/durchgang/${CODE}`);
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(next).toBeVisible({ timeout: 30_000 });
    await next.click();
    await next.click();

    await page
      .locator("#dg-contactPersonName")
      .fill("Kontaktstelle Informationssicherheit");
    await page
      .locator("#dg-contactPersonEmail")
      .fill("it-sicherheit@stadtwerk-musterstadt.de");
    await page.locator("#dg-lastRegistrationUpdate").fill("2026-09-01");
    await next.click();

    await expect(page.getByRole("heading", { name: "Kontakt erfasst" })).toBeVisible();

    await expect
      .poll(async () => {
        const rows = await intakeRows(tenant, "REG");
        return rows.find((r) => r.answers?.contactPersonEmail)?.answers ?? null;
      })
      .toMatchObject({
        contactPersonName: "Kontaktstelle Informationssicherheit",
        contactPersonEmail: "it-sicherheit@stadtwerk-musterstadt.de",
      });
    await expect.poll(() => itemDoneCount(tenant.company_id)).toBe(doneBefore + 1);
  });
});
