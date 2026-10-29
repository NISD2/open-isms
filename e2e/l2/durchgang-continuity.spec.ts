/**
 * L2 Durchgang continuity (4.2 and 4.4): a process marked as having to keep running is the
 * asset's own `is_critical` with how long it may be down, what it needs is a `process_asset`
 * link, and the plan prints both with the recovery order read off the 2.3 ratings. How long a
 * needed system takes back is the asset's own column, and the comparison puts the verdict before
 * management: on 4.4, and as an open point on the approval (7.3). Through the real UI against
 * real Postgres.
 *
 * Cleanup removes the assets, risk and plan this file adds (the links die with the assets),
 * because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, type Page, test } from "@playwright/test";
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

// 4.2: learn, example, keep running, what it needs, plan, done. The plan's lead is the one 3.1 names.
const KEEP_SCREEN = 2;
const NEEDS_SCREEN = 3;
const PLAN_SCREEN = 4;
// 4.4: learn, example, what to ask first, backup systems, how long each takes back, the comparison.
const RESTORE_SCREEN = 4;
const RECOVERY_SCREEN = 5;
// 7.3: learn, inputs, risk map, example, review, approve, done.
const APPROVE_SCREEN = 5;
const TYPE = "business_continuity";
const PROCESS = "E2E Auftragsannahme";
const SYSTEM = "E2E Warenwirtschaft";
const HOW = "Aufträge per Telefon und Papier";
const ALL_IN_TIME = "Alles, was gebraucht wird, kommt rechtzeitig zurück.";

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

/** How long the system takes back, as stored: "<restore_time>/<restore_time_unknown>". */
async function restoreOf(tenant: Tenant): Promise<string | null> {
  const [row] = await e2eQuery<{
    restore_time: string | null;
    restore_time_unknown: boolean;
  }>(
    `SELECT restore_time, restore_time_unknown FROM asset WHERE company_id = $1 AND name = $2`,
    [tenant.company_id, SYSTEM],
  );
  return row ? `${row.restore_time}/${row.restore_time_unknown}` : null;
}

/** On 4.4, answers how long the system takes back with the chip `answer`, and waits for the write. */
async function answerRestore(
  page: Page,
  tenant: Tenant,
  answer: string,
  stored: string,
): Promise<void> {
  await page.goto(`/de/durchgang/nis2/4.4?s=${RESTORE_SCREEN}`);
  const row = page.getByRole("listitem").filter({ hasText: SYSTEM });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole("button", { name: answer, exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect.poll(() => restoreOf(tenant)).toBe(stored);
}

test.describe("durchgang continuity", () => {
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
    await page.goto(`/de/durchgang/nis2/4.2?s=${KEEP_SCREEN}`);
    const row = page.getByRole("listitem").filter({ hasText: PROCESS });
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: "Muss weiterlaufen" }).click();
    await row.getByLabel("So geht es ohne IT weiter").fill(HOW);
    await row.getByRole("button", { name: "1 Tag", exact: true }).click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => {
        const [asset] = await e2eQuery<{
          is_critical: boolean | null;
          max_outage: string | null;
        }>(
          `SELECT is_critical, max_outage FROM asset WHERE company_id = $1 AND name = $2`,
          [tenant.company_id, PROCESS],
        );
        return asset ? `${asset.is_critical}/${asset.max_outage}` : null;
      })
      .toBe("true/day");
  });

  test("links what the process needs, picked from the company's own list", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/4.2?s=${NEEDS_SCREEN}`);
    const row = page.getByRole("listitem").filter({ hasText: PROCESS });
    await expect(row).toBeVisible({ timeout: 30_000 });

    const system = row.getByRole("button", { name: SYSTEM, exact: true });
    await system.click();
    await expect(system).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => {
        const [link] = await e2eQuery<{ n: string }>(
          `SELECT count(*)::text AS n
             FROM process_asset l
             JOIN asset p ON p.id = l.process_id
             JOIN asset s ON s.id = l.asset_id
            WHERE p.company_id = $1 AND p.name = $2 AND s.name = $3`,
          [tenant.company_id, PROCESS, SYSTEM],
        );
        return link?.n ?? "0";
      })
      .toBe("1");
  });

  test("prints the process with its tolerance, what it needs and the recovery order in the plan", async ({
    page,
  }) => {
    // The process line carries the tolerance and the need the first two tests chose, the span
    // in the plan's own sentence.
    const line = `${PROCESS} (höchstens einen Tag ohne IT, braucht ${SYSTEM}): ${HOW}`;
    await page.goto(`/de/durchgang/nis2/4.2?s=${PLAN_SCREEN}`);
    await expect(page.getByText(line)).toBeVisible({ timeout: 30_000 });
    await page.locator("#dg-policy-read").click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant, TYPE))?.content ?? "")
      .toContain(line);
    const policy = await walkPolicy(tenant, TYPE);
    expect(policy?.content).toContain(`1. ${SYSTEM}`);
  });

  test("records how long a needed system takes back, and the comparison says it is too slow (4.4)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/4.4?s=${RESTORE_SCREEN}`);
    const row = page.getByRole("listitem").filter({ hasText: SYSTEM });
    await expect(row).toBeVisible({ timeout: 30_000 });
    // Only what a process needs is asked, with the process behind it.
    await expect(row).toContainText(`Gebraucht von: ${PROCESS}`);
    await answerRestore(page, tenant, "3 Tage", "three_days/false");

    // Three days against the one day the process can wait.
    await page.goto(`/de/durchgang/nis2/4.4?s=${RECOVERY_SCREEN}`);
    await expect(
      page.getByRole("heading", { name: "Zu langsam", exact: true }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("listitem").filter({ hasText: SYSTEM })).toContainText(
      `Gebraucht von ${PROCESS} · darf höchstens stillstehen: 1 Tag · Wiederanlauf: 3 Tage`,
    );
    await expect(page.getByText(ALL_IN_TIME)).toHaveCount(0);
  });

  test("the approval lists the system that is too slow as an open point (7.3)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/7.3?s=${APPROVE_SCREEN}`);
    await expect(
      page.getByText(`Kommt langsamer zurück, als die Abläufe warten können: ${SYSTEM}`),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("takes 'unknown' as an answer, and lists it apart on 4.4 and on the approval", async ({
    page,
  }) => {
    await answerRestore(page, tenant, "unbekannt", "null/true");

    await page.goto(`/de/durchgang/nis2/4.4?s=${RECOVERY_SCREEN}`);
    await expect(
      page.getByRole("heading", { name: "Unbekannt", exact: true }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Zu langsam", exact: true }),
    ).toHaveCount(0);

    await page.goto(`/de/durchgang/nis2/7.3?s=${APPROVE_SCREEN}`);
    await expect(
      page.getByText(`Wie lange der Wiederanlauf dauert, weiß niemand: ${SYSTEM}`),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("says everything comes back in time once every needed system does", async ({
    page,
  }) => {
    await answerRestore(page, tenant, "Stunden", "hours/false");

    await page.goto(`/de/durchgang/nis2/4.4?s=${RECOVERY_SCREEN}`);
    await expect(
      page.getByRole("heading", { name: "Rechtzeitig", exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(ALL_IN_TIME)).toBeVisible();
  });
});
