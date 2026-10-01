/**
 * L2 Durchgang incident plan (3.1): the walk writes the company's incident plan from the template,
 * filled in with the answers given on the screens before it, and the signature page approves it,
 * through the real UI against real Postgres.
 *
 * Cleanup removes the policy and the clause choice this file wrote and restores the INC answers,
 * because later layers sign off against this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
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

// learn, lead, whom you call, second way example, second way, plan, signature, signed copy, done.
const LEAD_SCREEN = 1;
const SIGNATURE_SCREEN = 6;
const TYPE = "incident_response";

test.describe("durchgang incident plan", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await keepAnswers(tenant, "INC"),
      await keepPolicies(tenant, TYPE),
      await payFor(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  const plan = () => walkPolicy(tenant, TYPE);

  test("the plan is written with the answers given on the screens before it", async ({
    page,
  }) => {
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await page.goto(`/de/durchgang/3.1?s=${LEAD_SCREEN}`);
    const lead = page.locator("#dg-incidentLead");
    await expect(lead).toBeVisible({ timeout: 30_000 });
    await lead.fill("Anna Weber");
    await next.click();

    await page.locator("#dg-itEmergencyNumber").fill("Durchwahl 400");
    await page
      .locator("#dg-incidentEscalationContacts")
      .fill("Geschäftsführung: Jonas Muster");
    await next.click();
    await next.click();
    await page.locator("#dg-secureCommsChannel").fill("Threema Work");
    await next.click();

    // The preview is filled in from this visit's answers, before the save has landed.
    await expect(
      page.getByText("Anna Weber leitet die Bewältigung", { exact: false }),
    ).toBeVisible();
    const card = page.getByRole("button", { name: "IT-Notfallkarte" });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await next.click();

    await expect
      .poll(async () => (await plan())?.content ?? "")
      .toContain("## 9. IT-Notfallkarte");
    const content = (await plan())?.content ?? "";
    expect(content).toContain("Anna Weber leitet die Bewältigung eines Vorfalls.");
    expect(content).toContain("ruft sofort die IT-Notfallnummer Durchwahl 400 an.");
    expect(content).toContain("ruft die Leitung an: Geschäftsführung: Jonas Muster.");
    expect(content).toContain("erreichen wir uns über: Threema Work.");
    expect(content).toContain("mit unserer Nummer Durchwahl 400.");
    expect(content).not.toContain("{");
  });

  test("the signature approves the plan, without the sign-off columns", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/3.1?s=${SIGNATURE_SCREEN}`);
    const version = page.locator("#dg-incidentPlanVersion");
    await expect(version).toBeVisible({ timeout: 30_000 });
    await version.fill("1.0");
    await page.locator("#dg-incidentPlanApprovalDate").fill("2026-10-01");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect.poll(async () => (await plan())?.status ?? null).toBe("approved");
    expect(await plan()).toMatchObject({
      version: "1.0",
      effective_from: "2026-10-01",
      approved_by: null,
      approved_at: null,
      approver_role: null,
    });
  });
});
