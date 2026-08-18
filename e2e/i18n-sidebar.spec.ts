import { test, expect } from "@playwright/test";

/**
 * The portal sidebar used to build its category names from the English
 * message bundle regardless of locale (hardcoded complianceEn import).
 * These tests pin the fix: German users get German category names,
 * English users keep English ones.
 */
test("German portal sidebar shows German category names", async ({ page }) => {
  await page.goto("/de/dashboard");
  await page.getByRole("button", { name: /NIS2/ }).first().click();
  await expect(
    page.getByText("Risikomanagement", { exact: false }).first(),
  ).toBeVisible({ timeout: 30_000 });

  // innerText, not page.content(): the RSC flight payload in script tags
  // legitimately carries English DB seed names; only visible text counts.
  const text = await page.locator("body").innerText();
  expect(text).toContain("Vorfallbehandlung");
  expect(text).toContain("Lieferkettensicherheit");
  expect(text).not.toContain("Incident Handling");
  expect(text).not.toContain("Supply Chain Security");

  await page.screenshot({
    path: "e2e/.artifacts/de-sidebar.png",
    fullPage: false,
  });
});

test("English portal sidebar keeps English category names", async ({ page }) => {
  await page.goto("/en/dashboard");
  await page.getByRole("button", { name: /NIS2/ }).first().click();
  await expect(
    page.getByText("Risk Management", { exact: false }).first(),
  ).toBeVisible({ timeout: 30_000 });

  const text = await page.locator("body").innerText();
  expect(text).toContain("Incident Handling");
  expect(text).not.toContain("Vorfallbehandlung");

  await page.screenshot({
    path: "e2e/.artifacts/en-sidebar.png",
    fullPage: false,
  });
});
