/**
 * L2 GDPR walkthrough, the people it names, through the real UI against real Postgres:
 *
 *   - the breach lead starts on the NIS 2 incident lead, says where it came from, and moving on
 *     saves it as G-BRC.1's own answer;
 *   - the DPO is named by nobody by default, can be an outside provider, and the screen says
 *     there is nobody to name when the company designates none;
 *   - the Organisation page lists every role with its law and changes the same answer;
 *   - an approval page says it approves nothing for the other law.
 *
 * Everything the file writes is put back (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  enabledNext,
  intakeRows,
  keepAnswers,
  keepPolicies,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

const INCIDENT_LEAD = "E2E Anna Beispiel";
const BREACH_LEAD = "E2E Ben Muster";

/** One answer of a category's intake row, or undefined while the row or the answer is missing. */
const answerOf = async (tenant: Tenant, category: string, field: string) =>
  (await intakeRows(tenant, category))[0]?.answers?.[field];

/** Writes answers into a category's intake row, which earlier layers created. */
async function setAnswers(
  tenant: Tenant,
  category: string,
  answers: Record<string, unknown>,
  drop: readonly string[] = [],
) {
  const [row] = await intakeRows(tenant, category);
  if (!row) throw new Error(`the tenant has no ${category} answers to start from`);
  const next = Object.fromEntries(
    Object.entries({ ...(row.answers ?? {}), ...answers }).filter(
      ([k]) => !drop.includes(k),
    ),
  );
  await e2eQuery(`UPDATE company_category_intake SET answers = $2 WHERE id = $1`, [
    row.id,
    JSON.stringify(next),
  ]);
}

test.describe("GDPR walkthrough: who holds which role", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await payFor(tenant),
      await keepAnswers(tenant, "INC"),
      await keepAnswers(tenant, "BRC"),
      await keepAnswers(tenant, "DPO"),
    ];
    await setAnswers(tenant, "INC", { incidentLead: INCIDENT_LEAD });
  });

  test.afterAll(() => undoAll(undos));

  test("the breach lead starts on the NIS 2 incident lead and is saved as its own answer", async ({
    page,
  }) => {
    // G-BRC.1 asks nothing yet: its row may be missing, which the screen reads as empty.
    if ((await intakeRows(tenant, "BRC")).length > 0) {
      await setAnswers(tenant, "BRC", {}, ["breachLead"]);
    }
    // learn, notify, lead
    await page.goto("/de/durchgang/dsgvo/G-BRC.1?s=2");
    await expect(page.getByText(/^Übernommen aus 3\.1/)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#dg-breachLead")).toHaveValue(INCIDENT_LEAD);

    await enabledNext(page).click();
    await expect.poll(() => answerOf(tenant, "BRC", "breachLead")).toBe(INCIDENT_LEAD);
  });

  test("the DPO is nobody by default, may be an outside provider, and none names nobody", async ({
    page,
  }) => {
    // basics, learn, examples, decision, who
    await page.goto("/de/durchgang/dsgvo/G-DPO.1?s=3");
    await page.getByText("Keine Pflicht, wir benennen niemanden").click();
    await enabledNext(page).click();
    const nobody = page.getByText(/^Sie benennen keine Datenschutzbeauftragten/);
    await expect(nobody).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("radio")).toHaveCount(0);

    // Earlier layers may have named a DPO; the picker is checked from an empty answer.
    await setAnswers(tenant, "DPO", {}, ["dpoName"]);
    await page.goto("/de/durchgang/dsgvo/G-DPO.1?s=3");
    await page.getByText("Ja, Pflicht", { exact: true }).click();
    await enabledNext(page).click();
    const picker = page.getByRole("radiogroup", { name: "Datenschutzbeauftragte" });
    await expect(picker).toBeVisible({ timeout: 30_000 });
    // Naming nobody is an answer here, so nobody is picked for the person walking.
    await expect(picker.getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(picker.getByText("Ein externer Dienstleister")).toBeVisible();
  });

  test("the Organisation page lists each role with its law and changes the same answer", async ({
    page,
  }) => {
    await page.goto("/de/organization");
    const roles = page.locator("section").filter({ hasText: "Wer welche Rolle hat" });
    await expect(roles).toBeVisible({ timeout: 30_000 });
    const incident = roles.getByRole("listitem").filter({ hasText: INCIDENT_LEAD });
    await expect(incident.getByText("NIS2", { exact: true })).toBeVisible();
    const breach = roles.getByRole("listitem").filter({ hasText: "G-BRC.1" });
    await expect(breach.getByText("DSGVO", { exact: true })).toBeVisible();

    await breach.getByRole("button", { name: "Ändern" }).click();
    await breach.getByText("Jemand anderes").click();
    await breach.getByPlaceholder("Name der Person").fill(BREACH_LEAD);
    await breach.getByRole("button", { name: "Speichern" }).click();
    await expect.poll(() => answerOf(tenant, "BRC", "breachLead")).toBe(BREACH_LEAD);
  });

  test("the GDPR approval page says it approves nothing for NIS 2", async ({ page }) => {
    // An approval with nothing on it says only that, so the walk writes one document first.
    undos = [...undos, await keepPolicies(tenant, "gdpr_data_protection_policy")];
    // learn, policy
    await page.goto("/de/durchgang/dsgvo/G-ACT.1?s=1");
    await page
      .getByText("Ich habe das Dokument gelesen, und es passt zu unserem Unternehmen")
      .click({ timeout: 30_000 });
    await enabledNext(page).click();

    await page.goto("/de/durchgang/dsgvo/freigabe");
    const scope = page
      .locator("section")
      .filter({ hasText: "Was diese Freigabe umfasst" });
    await expect(scope).toBeVisible({ timeout: 30_000 });
    await expect(scope.getByText(/^Für NIS2 gibt sie nichts frei/)).toBeVisible();
    const other = scope.getByRole("link", {
      name: "NIS2 hat eine eigene Seite für die Freigabe.",
    });
    // German is the default locale, so its links carry no prefix.
    await expect(other).toHaveAttribute("href", "/durchgang/nis2/freigabe");
  });
});
