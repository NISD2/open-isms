/**
 * The one place that knows the signin form's selectors. Used by
 * auth.setup.ts and demo-evidence.ts; both accounts share the harness
 * password (see lib/env.ts).
 */
import type { Page } from "@playwright/test";
import { E2E_USER_PASSWORD } from "./env";

export async function signInViaForm(page: Page, email: string): Promise<void> {
  await page.goto("/de/auth/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(E2E_USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(journey|dashboard)/, { timeout: 30_000 });
}
