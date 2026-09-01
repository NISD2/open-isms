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
 * Proves the smoke above is not passing vacuously: without a session the
 * journey must not render.
 *
 * How that is enforced for the /journey root changed in #127. Anonymous
 * visitors used to meet the signin form; they now land on /start, the
 * public pre-login page, because /start had recorded zero visits while
 * nothing linked to it. Default-deny is unchanged everywhere else:
 * ANONYMOUS_LANDERS in proxy.ts is keyed on the exact stripped path, so
 * only the root is diverted and every deeper app URL still walls to
 * signin with callbackUrl preserved.
 *
 * Both halves are asserted. The lander on its own no longer proves
 * anything about auth, and the wall on its own would not notice the
 * lander regressing back to a login form.
 *
 * de is the default locale under localePrefix "as-needed", so the lander
 * target carries no locale prefix: /de/journey resolves to /start.
 */
test.describe("unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the journey root lands anonymous visitors on /start", async ({
    page,
  }) => {
    await page.goto("/de/journey");
    await page.waitForURL(/\/start$/, { timeout: 15_000 });
    await expect(page.locator('[data-testid^="journey-node-"]')).toHaveCount(
      0,
    );
  });

  test("a deeper app URL still walls to signin with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/de/risks");
    await page.waitForURL(/\/auth\/signin/, { timeout: 15_000 });
    expect(page.url()).toContain("callbackUrl");
    await expect(page.locator("#email")).toBeVisible();
  });
});
