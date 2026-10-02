/**
 * L2 Durchgang incident plan (3.1): the walk writes the company's incident plan from the template,
 * filled in with the answers given on the screens before it, with a clause and the company's own
 * words, through the real UI against real Postgres. Management approves it later, at 7.3.
 *
 * Cleanup removes the policy and the clause choice this file wrote and restores the INC answers,
 * because later layers sign off against this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  intakeRows,
  keepAnswers,
  keepPolicies,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
  walkPolicy,
} from "../lib/durchgang";

// learn, emergency contacts (the lead, the number, the channel, who else gets told), plan, done.
const LEAD_SCREEN = 1;
const PLAN_SCREEN = 2;
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
    // Earlier specs leave a lead in the answers; without one, the person walking is preselected.
    const rows = await intakeRows(tenant, "INC");
    await e2eQuery(
      `UPDATE company_category_intake SET answers = answers - 'incidentLead' WHERE id = ANY($1)`,
      [rows.map((r) => r.id)],
    );
  });

  test.afterAll(() => undoAll(undos));

  const plan = () => walkPolicy(tenant, TYPE);

  test("the plan is written with the answers given on the screens before it", async ({
    page,
  }) => {
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await page.goto(`/de/durchgang/3.1?s=${LEAD_SCREEN}`);
    const someoneElse = page.getByRole("radio", { name: "Jemand anderes" });
    await expect(someoneElse).toBeVisible({ timeout: 30_000 });
    // The person walking is picked until someone else is chosen.
    await expect(page.getByRole("radio", { checked: true })).not.toHaveAccessibleName(
      "Jemand anderes",
    );
    await someoneElse.click();
    await page.locator("#dg-incidentLead").fill("Anna Weber");
    await page.locator("#dg-itEmergencyNumber").fill("Durchwahl 400");
    // A tapped answer is added to what is written; start from an empty field.
    await page.locator("#dg-secureCommsChannel").fill("");
    await page.getByRole("button", { name: "SMS" }).click();
    await page.getByRole("button", { name: "Telefonliste auf Papier" }).click();
    await expect(page.locator("#dg-secureCommsChannel")).toHaveValue(
      "SMS; Telefonliste auf Papier",
    );
    await page
      .locator("#dg-incidentEscalationContacts")
      .fill("Geschäftsführung: Jonas Muster");
    await next.click();

    // The document is filled in from this visit's answers, before the save has landed.
    await expect(
      page.getByText("Anna Weber leitet die Bewältigung", { exact: false }),
    ).toBeVisible();
    const card = page.getByRole("button", { name: "IT-Notfallkarte" });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "IT-Notfallkarte" })).toBeVisible();
    // Weiter waits until the person has read the document.
    await expect(next).toBeDisabled();
    await page.locator("#dg-policy-read").click();
    await next.click();

    await expect
      .poll(async () => (await plan())?.content ?? "")
      .toContain("## 10. IT-Notfallkarte");
    const content = (await plan())?.content ?? "";
    expect(content).toContain("Anna Weber leitet die Bewältigung eines Vorfalls.");
    expect(content).toContain("ruft sofort die IT-Notfallnummer Durchwahl 400 an.");
    expect(content).toContain("ruft die Leitung an: Geschäftsführung: Jonas Muster.");
    expect(content).toContain("erreichen wir uns über: SMS; Telefonliste auf Papier.");
    expect(content).toContain("mit unserer Nummer Durchwahl 400.");
    expect(content).not.toContain("{");
    expect((await plan())?.status).toBe("draft");
  });

  test("the company's own words go in as the last section", async ({ page }) => {
    await page.goto(`/de/durchgang/3.1?s=${PLAN_SCREEN}`);
    const own = page.locator("#dg-policy-own");
    await expect(own).toBeVisible({ timeout: 30_000 });
    await own.fill("Notfallhandy der IT: 0170 1234567");
    await page.locator("#dg-policy-read").click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await plan())?.content ?? "")
      .toContain("## 11. Weitere Regelungen\n\nNotfallhandy der IT: 0170 1234567");
  });
});
