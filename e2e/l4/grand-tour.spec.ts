/**
 * L4 grand tour: the capstone. By the time this runs, the serial suite has
 * already populated the company's intake answers (l1), module records,
 * editor configs and evidence (l2), and exercised multi-party sign-off
 * (l3). This spec finishes the implementation: every requirement not yet
 * done is signed off through the real UI, and the run ends with the
 * journey at 49/49 and every status row completed in Postgres.
 */
import { test, expect } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { journeyCodes, slugByCode } from "../lib/journey";

test("grand tour: the company reaches a fully signed-off NIS2 implementation", async ({ page }) => {
  test.setTimeout(360_000);

  const signed: string[] = [];
  const alreadyDone: string[] = [];

  for (const code of journeyCodes) {
    await page.goto(`/de/compliance/${slugByCode.get(code)}/${code}`);
    const button = page.getByTestId("sign-off-button");
    const visible = await button
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!visible) {
      alreadyDone.push(code);
      continue;
    }
    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("assessment.signOff") && r.request().method() === "POST",
        { timeout: 20_000 },
      ),
      button.click(),
    ]);
    expect(resp.ok(), `signOff for ${code} returned HTTP ${resp.status()}`).toBe(true);
    signed.push(code);
  }

  console.log(
    `[grand-tour] signed ${signed.length}, already done ${alreadyDone.length} of ${journeyCodes.length}`,
  );

  // Authoritative: every NIS2 status row is terminal-done in the database.
  const open = await e2eQuery<{ code: string; status: string }>(
    `SELECT r.code, s.status
       FROM company_requirement_status s
       JOIN requirement r ON r.id = s.requirement_id
       JOIN company_assessment a ON a.id = s.assessment_id
       JOIN compliance_framework f ON f.id = a.framework_id
      WHERE f.code = 'nis2'
        AND s.status NOT IN ('completed', 'approved', 'not_applicable')
      ORDER BY r.code`,
  );
  expect(
    open.map((o) => `${o.code}:${o.status}`).join(", "),
    "requirements still open after the tour",
  ).toBe("");

  // And the product agrees: the sidebar shows the full count.
  await page.goto("/de/journey");
  await expect(page.getByText("49/49").first()).toBeVisible({ timeout: 20_000 });
});
