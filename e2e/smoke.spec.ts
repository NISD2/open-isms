import { test, expect } from "@playwright/test";

/**
 * Smoke: the authenticated journey renders all 49 NIS2 requirement nodes.
 * The journey router hard-filters to the NIS2 framework, so the count is
 * stable even with ISO 27001 active in the seed.
 */
test("journey renders all 49 NIS2 requirement nodes", async ({ page }) => {
  await page.goto("/de/journey");
  const nodes = page.locator('[data-testid^="journey-node-"]');
  await expect(nodes.first()).toBeVisible({ timeout: 30_000 });
  await expect(nodes).toHaveCount(49);
});

/**
 * Proves the smoke above is not passing vacuously: without the session,
 * the default-deny middleware must bounce /journey to the signin form.
 */
test.describe("unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("journey redirects to signin without a session", async ({ page }) => {
    await page.goto("/de/journey");
    await page.waitForURL(/\/auth\/signin/, { timeout: 15_000 });
    await expect(page.locator("#email")).toBeVisible();
    await expect(
      page.locator('[data-testid^="journey-node-"]'),
    ).toHaveCount(0);
  });
});
