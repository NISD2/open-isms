/**
 * L2 the walkthrough as the portal's front, for each kind of account (Simon, 03.10.2026): the
 * portal's home opens the walk; an account that has not paid sees it locked. A free account orders
 * from the offer ("Jetzt bestellen") and sees the registers with example rows; a grandfathered one
 * is offered its journey; a paid one walks.
 *
 * The tenant's level and the e2e person's grandfathering set per test, and put back afterwards.
 */
import { expect, type Page, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_USER_EMAIL } from "../lib/env";

interface Tenant {
  readonly user_id: string;
  readonly grandfathered_at: string | null;
  readonly billing_account_id: string;
  readonly access_level: string;
}

const sidebar = (page: Page) => page.locator("[data-sidebar=content]");

test.describe("the walkthrough as the portal's front", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;

  const setLevel = (level: "free" | "grandfathered" | "full") =>
    e2eQuery(`UPDATE billing_account SET access_level = $2 WHERE id = $1`, [
      tenant.billing_account_id,
      level,
    ]);

  test.beforeAll(async () => {
    const [row] = await e2eQuery<Tenant>(
      `SELECT u.id AS user_id, u.grandfathered_at, b.id AS billing_account_id, b.access_level
         FROM "user" u
         JOIN company c ON c.id = u.company_id
         JOIN billing_account b ON b.id = c.billing_account_id
        WHERE u.email = $1`,
      [E2E_USER_EMAIL],
    );
    if (!row) throw new Error("the e2e tenant has no billing account");
    tenant = row;
    // A person counts as grandfathered only when stamped, so the stored level decides alone.
    await e2eQuery(`UPDATE "user" SET grandfathered_at = NULL WHERE id = $1`, [
      tenant.user_id,
    ]);
  });

  test.afterAll(async () => {
    await e2eQuery(`UPDATE "user" SET grandfathered_at = $2 WHERE id = $1`, [
      tenant.user_id,
      tenant.grandfathered_at,
    ]);
    await e2eQuery(`UPDATE billing_account SET access_level = $2 WHERE id = $1`, [
      tenant.billing_account_id,
      tenant.access_level,
    ]);
  });

  test("a free account lands on the locked walk and orders from the offer", async ({
    page,
  }) => {
    await setLevel("free");
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);

    const order = page.getByRole("link", { name: "Jetzt bestellen" });
    await expect(order).toHaveAttribute("href", /\/billing\/offer$/);
    await expect(page.getByRole("link", { name: /^Weiter im Weg/ })).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Weg" })).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Assets" })).toBeVisible();

    await order.click();
    await expect(page).toHaveURL(/\/billing\/offer$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Wie möchten Sie weitermachen?",
    );

    // The registers open with example rows, never the company's own.
    await page.goto("/de/assets");
    await expect(page).toHaveURL(/\/assets$/);
    await expect(page.getByText("Beispiel", { exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "proALPHA ERP" })).toBeVisible();
    // A company's own records always leave with it.
    await page.goto("/de/export");
    await expect(page).toHaveURL(/\/export$/);
  });

  // CI has no billing keys, so ordering is not open and the order page does not exist: the locked
  // walk offers a grandfathered account only its journey (walkLockFor's unit tests cover the
  // order button beside it once ordering opens).
  test("a grandfathered account lands on the locked walk with its journey as the way on", async ({
    page,
  }) => {
    await setLevel("grandfathered");
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);

    await expect(page.getByRole("link", { name: "Jetzt bestellen" })).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Assets" })).toBeVisible();

    await page.getByRole("link", { name: /^Weiter im Weg/ }).click();
    await expect(page).toHaveURL(/\/journey$/);

    // The offer is for free accounts; anyone else is sent to the portal's home.
    await page.goto("/de/billing/offer");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);
  });

  test("a paid account walks", async ({ page }) => {
    await setLevel("full");
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);
    await expect(page.getByRole("link", { name: "Jetzt bestellen" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Weiter im Weg/ })).toHaveCount(0);
  });
});
