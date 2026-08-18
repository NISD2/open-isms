import { test, expect } from "@playwright/test";

/**
 * The portal sidebar used to build its category names from the English
 * message bundle regardless of locale (hardcoded complianceEn import).
 * These tests pin the fix: German users get German category names,
 * English users keep English ones.
 *
 * Assertions are scoped to the sidebar element (not the whole body) so
 * a future widget that legitimately renders English DB seed names in the
 * page content cannot fail the negative checks. networkidle after goto
 * ensures hydration before clicking the Radix collapsible trigger (a
 * pre-hydration click is silently lost).
 */
const SIDEBAR = '[data-slot="sidebar"]';

test("German portal sidebar shows German category names", async ({ page }) => {
  await page.goto("/de/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NIS2/ }).first().click();

  const sidebar = page.locator(SIDEBAR).first();
  await expect(
    sidebar.getByText("Risikomanagement", { exact: false }).first(),
  ).toBeVisible({ timeout: 30_000 });

  const text = await sidebar.innerText();
  expect(text).toContain("Vorfallbehandlung");
  expect(text).toContain("Lieferkettensicherheit");
  expect(text).not.toContain("Incident Handling");
  expect(text).not.toContain("Supply Chain Security");
});

test("English portal sidebar keeps English category names", async ({ page }) => {
  await page.goto("/en/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NIS2/ }).first().click();

  const sidebar = page.locator(SIDEBAR).first();
  await expect(
    sidebar.getByText("Risk Management", { exact: false }).first(),
  ).toBeVisible({ timeout: 30_000 });

  const text = await sidebar.innerText();
  expect(text).toContain("Incident Handling");
  expect(text).not.toContain("Vorfallbehandlung");
});
