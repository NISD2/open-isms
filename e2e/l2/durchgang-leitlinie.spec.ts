/**
 * L2 Durchgang Leitlinie (2.4): the walk writes the company's Leitlinie from the template with a
 * chosen clause, and a text changed after management approved it goes back to draft, through the
 * real UI against real Postgres. Management approves it at 7.3 (`durchgang-review.spec.ts`).
 *
 * Cleanup removes the policy and the clause choice this file wrote and restores the RSK answers,
 * because later layers sign off against this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  e2eUserId,
  enabledNext,
  keepAnswers,
  keepPolicies,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
  walkPolicy,
} from "../lib/durchgang";

// learn, Leitlinie, done.
const POLICY_SCREEN = 1;
const TYPE = "information_security";

test.describe("durchgang leitlinie", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await keepAnswers(tenant, "RSK"),
      await keepPolicies(tenant, TYPE),
      await payFor(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  const leitlinie = () => walkPolicy(tenant, TYPE);

  test("stores the base text when no clause is added", async ({ page }) => {
    await page.goto(`/de/durchgang/nis2/2.4?s=${POLICY_SCREEN}`);
    await expect(page.getByRole("button", { name: "Schulungen" })).toBeVisible({
      timeout: 30_000,
    });
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    // Weiter waits until the person says they have read the document.
    await expect(enabledNext(page)).toHaveCount(0);
    await page.locator("#dg-policy-read").click();
    await next.click();

    await expect.poll(async () => (await leitlinie())?.status ?? null).toBe("draft");
    const policy = await leitlinie();
    expect(policy?.title).toBe(
      `Leitlinie zur Informationssicherheit der ${tenant.company_name}`,
    );
    expect(policy?.content).toContain("## 7. Bekanntgabe und Inkrafttreten");
    expect(policy?.content).not.toContain("## 8.");
    expect(policy?.content).not.toContain("{company}");
  });

  test("a chosen clause is added to the text and remembered", async ({ page }) => {
    await page.goto(`/de/durchgang/nis2/2.4?s=${POLICY_SCREEN}`);
    const training = page.getByRole("button", { name: "Schulungen" });
    await expect(training).toBeVisible({ timeout: 30_000 });

    await training.click();
    await expect(training).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", {
        name: "8. Schulung und Sensibilisierung",
        exact: true,
      }),
    ).toBeVisible();
    await page.locator("#dg-policy-read").click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await leitlinie())?.content ?? "")
      .toContain("## 8. Schulung und Sensibilisierung");
    const [config] = await e2eQuery<{ config: { clauses: string[] } }>(
      `SELECT config FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
      [tenant.company_id, TYPE],
    );
    expect(config?.config.clauses).toEqual(["training"]);
  });

  test("a text changed after approval goes back to draft and loses the approval", async ({
    page,
  }) => {
    // As management's approval at 7.3 leaves it.
    await e2eQuery(
      `UPDATE policy SET status = 'approved', effective_from = '2026-10-01',
              approved_by = $3, approved_at = now(), approver_role = 'ceo'
        WHERE company_id = $1 AND type = $2`,
      [tenant.company_id, TYPE, await e2eUserId()],
    );
    await page.goto(`/de/durchgang/nis2/2.4?s=${POLICY_SCREEN}`);
    const training = page.getByRole("button", { name: "Schulungen" });
    await expect(training).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });

    await training.click();
    await expect(
      page.getByText(
        "Die geänderte Fassung muss die Geschäftsführung noch einmal freigeben.",
      ),
    ).toBeVisible();
    await page.locator("#dg-policy-read").click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect.poll(async () => (await leitlinie())?.status ?? null).toBe("draft");
    expect(await leitlinie()).toMatchObject({
      effective_from: null,
      approved_by: null,
      approved_at: null,
      approver_role: null,
    });
  });
});
