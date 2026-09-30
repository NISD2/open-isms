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
import { E2E_USER_EMAIL } from "../lib/env";

const CODE = "12.3";
const FIELDS_SCREEN = 2;

interface Tenant {
  company_id: string;
  billing_account_id: string;
  access_level: string;
}

interface IntakeRow {
  id: string;
  answers: Record<string, unknown> | null;
}

const intakeRows = (companyId: string) =>
  e2eQuery<IntakeRow>(
    `SELECT i.id, i.answers
       FROM company_category_intake i
       JOIN company_assessment a ON a.id = i.assessment_id
       JOIN requirement_category rc ON rc.id = i.category_id
      WHERE a.company_id = $1 AND rc.code = 'REG'`,
    [companyId],
  );

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
  let answersBefore: readonly IntakeRow[];

  test.beforeAll(async () => {
    const [row] = await e2eQuery<Tenant>(
      `SELECT c.id AS company_id, b.id AS billing_account_id, b.access_level
         FROM "user" u
         JOIN company c ON c.id = u.company_id
         JOIN billing_account b ON b.id = c.billing_account_id
        WHERE u.email = $1`,
      [E2E_USER_EMAIL],
    );
    if (!row) throw new Error("the e2e tenant has no billing account");
    tenant = row;
    answersBefore = await intakeRows(tenant.company_id);
    await e2eQuery(`UPDATE billing_account SET access_level = 'full' WHERE id = $1`, [
      tenant.billing_account_id,
    ]);
  });

  test.afterAll(async () => {
    await e2eQuery(`UPDATE billing_account SET access_level = $2 WHERE id = $1`, [
      tenant.billing_account_id,
      tenant.access_level,
    ]);
    const kept = new Set(answersBefore.map((r) => r.id));
    for (const row of answersBefore) {
      await e2eQuery(`UPDATE company_category_intake SET answers = $2 WHERE id = $1`, [
        row.id,
        JSON.stringify(row.answers ?? {}),
      ]);
    }
    for (const row of await intakeRows(tenant.company_id)) {
      if (!kept.has(row.id)) {
        await e2eQuery(`DELETE FROM company_category_intake WHERE id = $1`, [row.id]);
      }
    }
  });

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
    await expect(name).toBeVisible({ timeout: 30_000 });
    await name.fill("Abgewiesene Eingabe");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect(
      page.getByText("Das wurde nicht gespeichert.", { exact: false }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]s=${FIELDS_SCREEN}\\b`));
    await expect(name).toHaveValue("Abgewiesene Eingabe");

    const rows = await intakeRows(tenant.company_id);
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
        const rows = await intakeRows(tenant.company_id);
        return rows.find((r) => r.answers?.contactPersonEmail)?.answers ?? null;
      })
      .toMatchObject({
        contactPersonName: "Kontaktstelle Informationssicherheit",
        contactPersonEmail: "it-sicherheit@stadtwerk-musterstadt.de",
      });
    await expect.poll(() => itemDoneCount(tenant.company_id)).toBe(doneBefore + 1);
  });
});
