/**
 * Shared journey helpers: code -> category slug, and the sign-off drive
 * used by the l3 sign-off specs and the l4 grand tour.
 */

import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import { expect, type Page } from "@playwright/test";
import { e2eQuery } from "./db";
import { E2E_USER_EMAIL } from "./env";

/**
 * The journey renders in two layouts and each behaves differently, so a spec
 * that wants one of them has to say which is on screen. auth.setup.ts answers
 * "team" for the suite; any spec that switches is responsible for setting it
 * back, so file order cannot leak into the specs that follow.
 */
export async function setJourneyMode(mode: "solo" | "team" | null): Promise<void> {
  await e2eQuery(
    `UPDATE company SET journey_mode = $2
       WHERE id = (SELECT company_id FROM "user" WHERE email = $1)`,
    [E2E_USER_EMAIL, mode],
  );
}

export const slugByCode = new Map<string, string>();
export const journeyCodes: string[] = [];
for (const cat of [...nis2Categories].sort((a, b) => a.sortOrder - b.sortOrder)) {
  for (const r of getNis2RequirementsForCategory(cat.slug)) {
    slugByCode.set(r.code, cat.slug);
    journeyCodes.push(r.code);
  }
}

/** Canonical URL of a requirement page. Throws on an unknown code so
 *  framework-data drift fails loudly instead of skipping silently. */
export function requirementUrl(code: string): string {
  const slug = slugByCode.get(code);
  if (!slug) throw new Error(`no category slug for requirement ${code}`);
  return `/de/compliance/${slug}/${code}`;
}

/** Navigate to a requirement page and wait for hydration. networkidle is
 *  the ready signal that works for every page type (intake, custom editor,
 *  module); clicking earlier can be silently lost pre-hydration. */
export async function gotoRequirement(page: Page, code: string): Promise<void> {
  await page.goto(requirementUrl(code), { waitUntil: "networkidle" });
}

/**
 * Ensure the requirement is signable, via the product's own invalidation
 * path: saving answers flips a completed requirement back to in_progress.
 */
export async function makeSignable(page: Page, code: string): Promise<void> {
  await gotoRequirement(page, code);
  if (
    await page
      .getByTestId("sign-off-button")
      .isVisible()
      .catch(() => false)
  ) {
    return;
  }
  const edit = page.getByTestId("requirement-edit");
  const save = page.getByTestId("requirement-save");
  await expect(edit.or(save).first()).toBeVisible({ timeout: 20_000 });
  if (await edit.isVisible()) await edit.click();
  await save.click();
  await expect(edit).toBeVisible({ timeout: 20_000 });
  await page.reload();
}

/** Sign the requirement via the real button, asserting the mutation. */
export async function signOffViaUi(page: Page, code: string): Promise<void> {
  await makeSignable(page, code);
  const button = page.getByTestId("sign-off-button");
  await expect(button).toBeVisible({ timeout: 20_000 });
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("assessment.signOff") && r.request().method() === "POST",
      { timeout: 20_000 },
    ),
    button.click(),
  ]);
  expect(resp.ok(), `signOff mutation HTTP ${resp.status()}`).toBe(true);
}
