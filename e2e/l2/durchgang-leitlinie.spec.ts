/**
 * L2 Durchgang Leitlinie (2.4): the walk writes the company's Leitlinie from the template with a
 * chosen clause, and the signature page approves it, through the real UI against real Postgres.
 *
 * Cleanup removes the policy and the clause choice this file wrote and restores the RSK answers,
 * because later layers sign off against this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  keepAnswers,
  keepPolicies,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
  walkPolicy,
} from "../lib/durchgang";

// learn, Leitlinie, signature, signed copy, done.
const POLICY_SCREEN = 1;
const SIGNATURE_SCREEN = 2;
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
    await page.goto(`/de/durchgang/2.4?s=${POLICY_SCREEN}`);
    await expect(page.getByRole("button", { name: "Schulungen" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

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
    await page.goto(`/de/durchgang/2.4?s=${POLICY_SCREEN}`);
    const training = page.getByRole("button", { name: "Schulungen" });
    await expect(training).toBeVisible({ timeout: 30_000 });

    await training.click();
    await expect(training).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("8. Schulung und Sensibilisierung")).toBeVisible();
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

  test("a refused approval is sent again on retry, and never writes the sign-off columns", async ({
    page,
  }) => {
    const refusal = { once: true };
    await page.route(
      (url) => url.pathname.includes("durchgang.approvePolicy"),
      async (route) => {
        if (refusal.once) {
          refusal.once = false;
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: "{}",
          });
        } else {
          await route.continue();
        }
      },
    );

    await page.goto(`/de/durchgang/2.4?s=${SIGNATURE_SCREEN}`);
    const version = page.locator("#dg-policyVersion");
    await expect(version).toBeVisible({ timeout: 30_000 });
    await version.fill("1.0");
    await page.locator("#dg-policyApprovalDate").fill("2026-10-01");
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await next.click();

    await expect(
      page.getByText("Das wurde nicht gespeichert.", { exact: false }),
    ).toBeVisible();
    expect((await leitlinie())?.status).toBe("draft");

    await next.click();
    await expect.poll(async () => (await leitlinie())?.status ?? null).toBe("approved");
    expect(await leitlinie()).toMatchObject({
      version: "1.0",
      effective_from: "2026-10-01",
      approved_by: null,
      approved_at: null,
      approver_role: null,
    });
  });

  test("a text changed after approval goes back to draft", async ({ page }) => {
    await page.goto(`/de/durchgang/2.4?s=${POLICY_SCREEN}`);
    const training = page.getByRole("button", { name: "Schulungen" });
    await expect(training).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });

    await training.click();
    await expect(
      page.getByText("Die geänderte Fassung braucht eine neue Unterschrift."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect.poll(async () => (await leitlinie())?.status ?? null).toBe("draft");
    expect((await leitlinie())?.effective_from).toBeNull();
  });
});
