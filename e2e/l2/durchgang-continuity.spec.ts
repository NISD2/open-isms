/**
 * L2 Durchgang continuity plan lists (4.2): a process marked as having to keep running is the
 * asset's own `is_critical`, and the plan prints it with its line and the recovery order read off
 * the 2.3 ratings, through the real UI against real Postgres.
 *
 * Cleanup removes the assets, risk and plan this file adds, because later layers read this tenant
 * (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  keepPolicies,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
  walkPolicy,
} from "../lib/durchgang";

// learn, example, keep running, lead, plan, done.
const KEEP_SCREEN = 2;
const PLAN_SCREEN = 4;
const TYPE = "business_continuity";
const PROCESS = "E2E Auftragsannahme";
const SYSTEM = "E2E Warenwirtschaft";
const HOW = "Aufträge per Telefon und Papier";

/** A process to mark, and a system rated existential, so the plan has a recovery order. */
async function seedLists(tenant: Tenant): Promise<Undo> {
  await e2eQuery(
    `INSERT INTO asset (company_id, name, type) VALUES ($1, $2, 'process'), ($1, $3, 'application')`,
    [tenant.company_id, PROCESS, SYSTEM],
  );
  await e2eQuery(
    `WITH r AS (
       INSERT INTO risk (company_id, title, description, likelihood, impact, risk_score, treatment)
       VALUES ($1, $2, 'E2E', 1, 4, 4, 'mitigate') RETURNING id
     )
     INSERT INTO risk_asset (risk_id, asset_id)
     SELECT r.id, a.id FROM r, asset a WHERE a.company_id = $1 AND a.name = $2`,
    [tenant.company_id, SYSTEM],
  );
  return async () => {
    const seeded = `SELECT id FROM risk WHERE company_id = $1 AND title = $2 AND description = 'E2E'`;
    await e2eQuery(`DELETE FROM risk_asset WHERE risk_id IN (${seeded})`, [
      tenant.company_id,
      SYSTEM,
    ]);
    await e2eQuery(`DELETE FROM risk WHERE id IN (${seeded})`, [
      tenant.company_id,
      SYSTEM,
    ]);
    await e2eQuery(`DELETE FROM asset WHERE company_id = $1 AND name IN ($2, $3)`, [
      tenant.company_id,
      PROCESS,
      SYSTEM,
    ]);
  };
}

test.describe("durchgang continuity lists", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await keepPolicies(tenant, TYPE),
      await seedLists(tenant),
      await payFor(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("marks a process that must keep running on the asset itself", async ({ page }) => {
    await page.goto(`/de/durchgang/4.2?s=${KEEP_SCREEN}`);
    const row = page.getByRole("listitem").filter({ hasText: PROCESS });
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: "Muss weiterlaufen" }).click();
    await row.getByLabel("So geht es ohne IT weiter").fill(HOW);
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => {
        const [asset] = await e2eQuery<{ is_critical: boolean | null }>(
          `SELECT is_critical FROM asset WHERE company_id = $1 AND name = $2`,
          [tenant.company_id, PROCESS],
        );
        return asset?.is_critical ?? null;
      })
      .toBe(true);
  });

  test("prints the process with its line and the recovery order in the plan", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/4.2?s=${PLAN_SCREEN}`);
    await expect(page.getByText(`${PROCESS}: ${HOW}`)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant, TYPE))?.content ?? "")
      .toContain(`${PROCESS}: ${HOW}`);
    const policy = await walkPolicy(tenant, TYPE);
    expect(policy?.content).toContain(`1. ${SYSTEM}`);
  });
});
