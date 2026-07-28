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
