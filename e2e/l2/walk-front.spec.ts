/**
 * L2 the walkthrough as the portal's front, for each kind of account (Simon, 03.10.2026): the
 * portal's home opens the walk; an account that has not paid walks the free steps and then sees the
 * offer. A free account orders from it ("30 Tage testen, Geld zurück") and sees the registers with
 * example rows; a grandfathered one is offered its journey beside it; a paid one walks.
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

/**
 * A step of "Ihr Weg" that the account may not walk: it shows itself on hover and its card leads to
 * the order. 5.1 comes after the last free step (2.2), so it is locked for any account that has not
 * paid, however far the free part is walked.
 */
const lockedStep = (page: Page) =>
  page.getByRole("link", { name: "So sieht „Aufschreiben, wer für Sie arbeitet“ aus" });

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

    // Whether the free steps are done or not (the home shows the intro or the offer), every step
    // after them is locked and leads to the order.
    const locked = lockedStep(page);
    await expect(locked).toHaveAttribute("href", /\/billing\/offer$/);
    await expect(page.getByRole("link", { name: /^Weiter im Weg/ })).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Weg" })).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Assets" })).toBeVisible();

    await locked.click();
    await expect(page).toHaveURL(/\/billing\/offer$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Wie möchten Sie weitermachen?",
    );

    // The step where management signs is locked too, so a free step's sign-off tick leads to its
    // preview, which says the sign-off comes with the order (an outside tester, 30.10.2026: it
    // "just scrolls to the locked items", with no word that it is paid).
    await page.goto("/de/durchgang/nis2");
    await page
      .getByRole("link", {
        name: "Noch nicht freigegeben. Die Freigabe durch die Geschäftsführung kommt mit der Bestellung",
      })
      .first()
      .click();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Das füllen Sie aus, sobald das Unternehmen bestellt hat",
      }),
    ).toBeVisible();

    // The activity log shows examples before the order, and says the walk is recorded already.
    await page.goto("/de/audit");
    await expect(
      page.getByText("Was Sie im Durchgang tun, wird schon jetzt festgehalten", {
        exact: false,
      }),
    ).toBeVisible();

    // The registers open with example rows, never the company's own.
    await page.goto("/de/assets");
    await expect(page).toHaveURL(/\/assets$/);
    await expect(page.getByText("Beispiel", { exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "proALPHA ERP" })).toBeVisible();
    // A company's own records always leave with it.
    await page.goto("/de/export");
    await expect(page).toHaveURL(/\/export$/);
  });

  // CI has no billing keys, so ordering is not open and the order page does not exist: a locked
  // step leads to the public pricing page instead. The journey stays open to the account.
  test("a grandfathered account lands on the locked walk with its journey as the way on", async ({
    page,
  }) => {
    await setLevel("grandfathered");
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);

    await expect(lockedStep(page)).toHaveAttribute("href", /\/preise$/);
    await expect(sidebar(page).getByRole("link", { name: "Assets" })).toBeVisible();

    await page.goto("/de/journey");
    await expect(page).toHaveURL(/\/journey$/);

    // The offer is for free accounts; anyone else is sent to the portal's home.
    await page.goto("/de/billing/offer");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);
  });

  test("a paid account walks", async ({ page }) => {
    await setLevel("full");
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/durchgang\/nis2$/);
    await expect(lockedStep(page)).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "30 Tage testen, Geld zurück" }),
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Weiter im Weg/ })).toHaveCount(0);
  });
});
