/**
 * L2 the GDPR walkthrough's paywall, the same as the NIS 2 walk's (walk-front.spec.ts): an account
 * that has not paid opens the walk's home and its free steps (through G-ROP.1, the record of
 * processing activities); every later step is locked and leads to the order, as its page and the
 * approval do, and the record page shows example rows. A paid account walks it all.
 *
 * The tenant's level is set per test and put back afterwards.
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_USER_EMAIL } from "../lib/env";

interface Tenant {
  readonly user_id: string;
  readonly grandfathered_at: string | null;
  readonly billing_account_id: string;
  readonly access_level: string;
}

// G-DPA.1 comes after the GDPR walk's last free step (G-ROP.1).
const LOCKED = "Ihre Auftragsverarbeiter und ihre Verträge festhalten";
const FREE = "Ihr Verzeichnis von Verarbeitungstätigkeiten anlegen";

test.describe("the GDPR walkthrough's paywall", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;

  const setLevel = (level: "free" | "full") =>
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

  test("a free account walks the free steps; the rest leads to the order", async ({
    page,
  }) => {
    await setLevel("free");
    await page.goto("/de/durchgang/dsgvo");
    await expect(page).toHaveURL(/\/durchgang\/dsgvo$/);

    const locked = page.getByRole("link", { name: `„${LOCKED}“ gehört zur Bestellung` });
    await expect(locked).toHaveAttribute("href", /\/billing\/offer$/, {
      timeout: 30_000,
    });
    // The free step's card is its own link; its name ends with the step's state.
    await expect(page.getByRole("link").filter({ hasText: FREE })).toHaveAttribute(
      "href",
      /\/durchgang\/dsgvo\/G-ROP\.1$/,
    );

    // A free step opens; a locked one, and the approval, lead to the offer, as in NIS 2 (the
    // portal sends every page past the free ones there).
    await page.goto("/de/durchgang/dsgvo/G-ROP.1");
    await expect(page).toHaveURL(/\/durchgang\/dsgvo\/G-ROP\.1$/);
    await page.goto("/de/durchgang/dsgvo/G-DPA.1");
    await expect(page).toHaveURL(/\/billing\/offer$/);
    await page.goto("/de/durchgang/dsgvo/freigabe");
    await expect(page).toHaveURL(/\/billing\/offer$/);

    // The record opens with example rows, never the company's own.
    await page.goto("/de/processing-activities");
    await expect(page).toHaveURL(/\/processing-activities$/);
    await expect(page.getByText("Beispiel", { exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Lohnabrechnung" })).toBeVisible();
  });

  test("a paid account walks every step", async ({ page }) => {
    await setLevel("full");
    await page.goto("/de/durchgang/dsgvo");
    await expect(
      page.getByRole("link", { name: `„${LOCKED}“ gehört zur Bestellung` }),
    ).toHaveCount(0);
    await page.goto("/de/durchgang/dsgvo/G-DPA.1");
    await expect(page).toHaveURL(/\/durchgang\/dsgvo\/G-DPA\.1$/);
  });
});
